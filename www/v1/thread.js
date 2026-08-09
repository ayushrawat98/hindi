const ISMOBILE = window.innerWidth <= 768

//remove any popup on click anywhere
document.addEventListener("click", (ev) => {
	if(activePopupWrapper){
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

function setShareButton() {
	document.querySelectorAll('.share').forEach((btn) => {
		btn.addEventListener('click', (event) => {
			let id = btn.getAttribute('data-post-number')
			let removeHashIfAny = window.location.href.split('#')[0]
			let shareLink = removeHashIfAny + '#' + id
			navigator.clipboard.writeText(shareLink)
		})
	})
}

function setRepliesToPost() {
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
			link.parentElement.appendChild(goToLinkElem)
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

function addPopup(currentNode, linkevent, postHash, addOverlay) {
	linkevent.stopPropagation()
	removeActivePopupWrapper()
	if (!postHash) return;
	if (activePopupWrapper) {

	}
	const currentPost = document.getElementById(postHash)
	//if the post was delete by moderator , gray it and give a line through
	if (!currentPost) {
		currentNode.style.color = 'gray'
		currentNode.style.textDecoration = "line-through"
		return;
	}

	let clone = currentPost.cloneNode(true)
	//remove expanded image from clone
	let cloneThumbnails = clone.querySelectorAll("img, video")
	if (cloneThumbnails[0]?.classList.contains("thumbnail--removed")) {
		toggleThumbnailClass(cloneThumbnails)
	}


	clone.classList.add("popup")
	clone.classList.remove("post--border")

	//find true unexpanded currentPost height
	let currentPostThumbnails = currentPost.querySelectorAll("img, video")
	let currentPostHeight = currentPost.offsetHeight
	if (currentPostThumbnails[0]?.classList.contains("thumbnail--removed")) {
		toggleThumbnailClass(currentPostThumbnails)
		currentPostHeight = currentPost.offsetHeight
		toggleThumbnailClass(currentPostThumbnails)
	}


	currentPostHeight = Math.min(currentPostHeight, 300)
	
	//find correct place to show popup
	clone.style.top = linkevent.pageY < 300 ?
		`${linkevent.pageY + 20}px` :
		`${linkevent.pageY - currentPostHeight - 20}px`
	clone.style.left = currentPost.offsetLeft + "px"
	clone.style.width = currentPost.offsetWidth + "px"

	let overlay
	if (addOverlay) {
		overlay = document.createElement('div');
		overlay.classList.add("overlay")
		overlay.addEventListener('click', (e) => {
			// Only close if the user clicks the overlay itself, not the clone content
			if (e.target === overlay) {
				overlay.remove();
				activePopupWrapper = undefined;
			}
		});
		overlay.appendChild(clone);
	} else {
		//no overlay , make clone fixed
		clone.style.position = "absolute"
	}
	document.querySelector('.board-feed__column--hot').appendChild(addOverlay ? overlay : clone)
	activePopupWrapper = clone
}


function expandFile() {
	document.querySelectorAll(".thumbnail-js").forEach(file => file.addEventListener("click", (event) => {
		//on click , expand the image/video
		let thumbnail = event.currentTarget
		let og = event.currentTarget.nextElementSibling

		let toggle = () => {
			thumbnail.classList.toggle("thumbnail--removed")
			og.classList.toggle("thumbnail--removed")
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

function setRepliesForPost() {
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

	//remove duplicates from replyArray


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

			fragment.appendChild(spanContainer);
			// fragment.appendChild(linkElem);
			// fragment.appendChild(goToLinkElem);
		});

		footerElem.appendChild(fragment);
		postNode.appendChild(footerElem)
	}
}

function addPopupEventHandler(linkElem, replyId) {
	//on pointer/mouse hover to show , click to go
	//on touch click to show , hash to go

	//for mobile
	linkElem.addEventListener('click', (linkevent) => {
		if (linkevent.pointerType == "touch") {
			linkevent.preventDefault()
			addPopup(linkElem, linkevent, replyId, false)
		}
	})

	//hover for pc only
	linkElem.addEventListener('pointerenter', (linkevent) => {
		if (linkevent.pointerType === "touch") return;
		// console.log("pointer eneter")
		addPopup(linkElem, linkevent, replyId, false)
	})

	linkElem.addEventListener('pointerleave', (linkevent) => {
		if (linkevent.pointerType === "touch") return;
		// console.log("pointer leave")
		removeActivePopupWrapper()
	})
}


setShareButton()
showOP()
expandFile()
setRepliesForPost()
setRepliesToPost()