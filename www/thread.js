const ISMOBILE = window.innerWidth <= 768

//scroll to last position on coming back
window.addEventListener("load", () => {
	scrollToLastPos()
})


function debounce(cb, time){
	let timeout
	return () => {
		if(timeout) clearTimeout(timeout);
		timeout = setTimeout(() => {
			cb()
		}, time);
	}
}

//save scroll position in particular thread
function saveScrollPosition(postId, position) {
  const positions = JSON.parse(localStorage.getItem('post_scroll_positions')) || {};
  positions[postId] = position;
  localStorage.setItem('post_scroll_positions', JSON.stringify(positions));
}

//retrieve a scroll position
function getScrollPosition(postId) {
  const positions = JSON.parse(localStorage.getItem('post_scroll_positions')) || {};
  return positions[postId] || 0;
}

function saveScrollWrapper(){
	const position = window.scrollY
	const postId = window.location.pathname.split("/")[2]
	saveScrollPosition(postId, position) 
}

function scrollToLastPos(){
	const postId = window.location.pathname.split("/")[2]
	const lastScrollPos = getScrollPosition(postId)
	window.scrollBy({
		top : lastScrollPos,
		behavior : "instant"
	})
}

window.addEventListener("scroll", debounce(saveScrollWrapper, 500))

//remove any popup on click anywhere
document.addEventListener("click", (ev) => {
	if (activePopupWrapper && !ev.defaultPrevented) {
		removeActivePopupWrapper()
	}
})

function showOP() {
	let opPostId = document.querySelector('.post-list--thread').firstElementChild.getAttribute('id')
	document.querySelectorAll('.replyText').forEach((link) => {
		if (link.getAttribute('href') == '#' + opPostId) {
			link.textContent += ' (मूल लेखक)'
		}
	})
}

function setContentReplies() {
	const list = document.querySelectorAll('[data-post-number-link]')
	list.forEach(link => {
		let postId = link.getAttribute('data-post-number-link')
		addPopupEventHandler(link, postId)

		//add hash on mobile
		if (ISMOBILE) {
			const goToLinkElem = document.createElement("a");
			goToLinkElem.href = "#" + postId;
			goToLinkElem.textContent = " #";
			goToLinkElem.classList.add("replyText")
			link.parentElement.append(goToLinkElem)
		}
	})
}

function toggleThumbnailClass(elemList) {
	elemList[0]?.classList.toggle("thumbnail--removed")
	elemList[1]?.classList.toggle("thumbnail--removed")
}

let activePopupWrapper = null
function removeActivePopupWrapper() {
	activePopupWrapper?.remove()
	activePopupWrapper = null
}

function addPopup(currentNode, linkevent, postHash) {
	linkevent.preventDefault()
	removeActivePopupWrapper()
	if (!postHash) return;
	
	const currentPost = document.getElementById(postHash)
	//if the post was delete by moderator , gray it and give a line through
	if (!currentPost) {
		currentNode.style.color = 'gray'
		currentNode.style.textDecoration = "line-through"
		return;
	}

	let clone = currentPost.cloneNode(true)
	clone.classList.add("popup")

	//remove expanded image and add back thumbnail
	let cloneThumbnails = clone.querySelectorAll("img, video")
	cloneThumbnails[0]?.classList.remove("thumbnail--removed")
	cloneThumbnails[1]?.remove()

	//set temporary clone css
	clone.style.position = "absolute"
	clone.style.visibility = "hidden"
	clone.style.left = "0"
	clone.style.top = "0"

	//append clone
	document.querySelector('.board-feed__column--hot').append(clone)

	//find clone height
	let cloneHeight = Math.min(clone.offsetHeight, 300)

	//find correct place to show popup
	clone.style.top = linkevent.clientY < (cloneHeight + 20) ?
		`${linkevent.pageY + 20}px` :
		`${linkevent.pageY - cloneHeight - 20}px`
	clone.style.left = currentPost.offsetLeft + "px"
	clone.style.width = currentPost.offsetWidth + "px"

	//show clone
	clone.style.visibility = ""

	
	//force load lazy image before appending
	forceLoadLazyImage(clone)

	//save clone object
	activePopupWrapper = clone
}


function expandFile() {
	document.querySelectorAll(".thumbnail-js").forEach(file => file.addEventListener("click", (event) => {
		//on click , expand the image/video
		let thumbnail = event.target
		let og = event.target.nextElementSibling

		let toggle = () => {
			thumbnail.classList.toggle("thumbnail--removed")
			og.classList.toggle("thumbnail--removed")

			if (!og.src) {
				if (og.nodeName == "VIDEO") {
					og.poster = og.dataset.poster
				}
				og.src = og.dataset.src
			}
		}

		toggle()

		//add event listener on og if not video
		if (og.nodeName != "VIDEO") {
			og.addEventListener("click", (secEvent) => {
				toggle()
			}, { once: true })
		}
	}))
}

function setFooterReplies() {
	let postNodes = document.querySelectorAll(".board-feed__column--hot .post-list .post")

	let postMap = new Map()
	let replyArray = []
	let seen = {}

	postNodes.forEach(article => {
		const postId = article.id

		if (!postMap.has(postId)) {
			postMap.set(postId, [article, []]) //id, htmlelement, reply array
		}

		article.querySelectorAll(".replyText").forEach(link => {
			if (seen[link.getAttribute("data-post-number-link")] != postId) {
				replyArray.push([link.getAttribute("data-post-number-link"), postId])
				seen[link.getAttribute("data-post-number-link")] = postId
			}
		})
	})

	for (let [replyTo, replyFrom] of replyArray) {
		postMap.get(replyTo)[1].push(replyFrom)
	}

	//add the links
	for (let [postId, [postNode, repliesId]] of postMap) {
		if (repliesId.length === 0) continue;
		
		const footerElem = document.createElement("footer")
		footerElem.classList.add("post__footer")

		// Use a DocumentFragment to batch DOM inserts into a single paint cycle
		const fragment = document.createDocumentFragment();

		const firstElem = document.createElement("span");
		firstElem.textContent = "उत्तर : ";
		firstElem.style.marginRight = "8px";
		fragment.appendChild(firstElem);

		repliesId.forEach(replyId => {

			const linkElem = document.createElement("a");
			// linkElem.style.marginRight = "8px";
			linkElem.href = "#" + replyId;
			// linkElem.style.textDecoration = "underline"
			linkElem.textContent = ">>" + replyId;
			linkElem.classList.add("replyText")

			addPopupEventHandler(linkElem, replyId)

			let goToLinkElem
			if (ISMOBILE) {
				goToLinkElem = document.createElement("a");
				// goToLinkElem.style.marginRight = "12px";
				goToLinkElem.href = "#" + replyId;
				// goToLinkElem.style.textDecoration = "underline"
				goToLinkElem.textContent = " #";
				goToLinkElem.classList.add("replyText")
			}

			const spanContainer = document.createElement("span")
			spanContainer.style.marginRight = "12px";
			spanContainer.append(...(goToLinkElem ? [linkElem, goToLinkElem] : [linkElem]))

			fragment.append(spanContainer);
		});

		footerElem.append(fragment);
		postNode.append(footerElem)
	}
}

function addPopupEventHandler(linkElem, replyId) {
	//on pointer/mouse hover to show , click to go
	//on touch click to show , hash to go

	linkElem.addEventListener('click', (linkevent) => {
		if (linkevent.pointerType == "touch") {
			linkevent.preventDefault()
			addPopup(linkElem, linkevent, replyId)
		}
	})

	linkElem.addEventListener('pointerenter', (linkevent) => {
		if (linkevent.pointerType === "touch") {
			linkevent.preventDefault()
			return false
		}
		addPopup(linkElem, linkevent, replyId)
	})

	linkElem.addEventListener('pointerleave', (linkevent) => {
		if (linkevent.pointerType === "touch") {
			linkevent.preventDefault()
			return false
		}
		removeActivePopupWrapper()
	})
}

//images are loaded on intersection observer
//if image are referenced and far away they dont load
//so manually loading them
function forceLoadLazyImage(post) {
	let i = post.querySelector("img") //first thumbnail
	if (i && !i.src) {
		i.src = i.dataset.src
	}
}

function goDownUp() {
	document.getElementById("go-down").addEventListener("click", (e) => {
		window.scrollTo({
			top: document.documentElement.scrollHeight
		})
	})

	document.getElementById("go-up").addEventListener("click", (e) => {
		window.scrollTo({
			top: 0
		})
	})
}

function addVideoPauseObserver() {
	const options = {
		threshold: 0.0
	}
	const callback = (entries, observer) => {
		entries.forEach((entry) => {
			if (!entry.isIntersecting) {
				//src is present and video is playing
				if (entry.target.src && !entry.target.paused) {
					entry.target.pause()
				}
				// observer.unobserve(entry.target);
			}
		})
	}
	const observer = new IntersectionObserver(callback, options)
	document.querySelectorAll("video").forEach(thumbnail => observer.observe(thumbnail))
}

showOP()
expandFile()
setFooterReplies()
setContentReplies()
goDownUp()
addVideoPauseObserver()