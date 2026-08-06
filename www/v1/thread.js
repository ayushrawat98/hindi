function scrollToPost() {
	const postHash = window.location.hash
	if (postHash) {
		const postId = postHash.slice(1)
		let post = document.getElementById(postId)
		if (post) {
			const oldBackgroundColor = post.style.backgroundColor
			post.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'
			setTimeout(() => {
				post.style.backgroundColor = oldBackgroundColor
			}, 2000);
		}
	}
}

function showOP() {
	let opPostId = document.querySelector('.post-list').firstElementChild.getAttribute('id')
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

function setReplyPost() {
	const list = document.querySelectorAll('[data-post-number-link]')
	list.forEach(link => {
		let postId = link.getAttribute('data-post-number-link')
		//click for mobile only
		link.addEventListener('click', (linkevent) => {
			linkevent.preventDefault()
			if (linkevent.pointerType !== "touch") return;
			// console.log("pointer click")
			addPopup(link, linkevent, postId, true)
		})

		//hover for pc only
		link.addEventListener('pointerenter', (linkevent) => {
			if (linkevent.pointerType === "touch") return;
			// console.log("pointer eneter")
			addPopup(link, linkevent, postId, false)
		})

		link.addEventListener('pointerleave', (linkevent) => {
			if (linkevent.pointerType === "touch") return;
			// console.log("pointer leave")
			removeActivePopupWrapper()
		})
	})
}

function toggleThumbnailClass(elemList) {
	elemList[0]?.classList.toggle("thumbnail--removed")
	elemList[1]?.classList.toggle("thumbnail--removed")
}

let activePopupWrapper = null
function removeActivePopupWrapper (){
	activePopupWrapper.remove()
	activePopupWrapper = null
}

function addPopup(currentNode, linkevent, postHash, addOverlay) {
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
	clone.style.top = linkevent.clientY < 300 ?
		`${linkevent.clientY + 20}px` :
		`${linkevent.clientY - currentPostHeight - 20}px`
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
		clone.style.position = "fixed"
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


function getReplies() {
	let postNodes = document.querySelectorAll(".board-feed__column--hot .post-list .post")

	let postMap = new Map()
	let replyArray = []

	postNodes.forEach(article => {
		const postId = article.id

		if (!postMap.has(postId)) {
			postMap.set(postId, [article, []]) //id, htmlelement, reply array
		}

		article.querySelectorAll(".replyText").forEach(link => {
			replyArray.push([link.getAttribute("data-post-number-link"), postId])
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
			linkElem.style.marginRight = "8px";
			linkElem.href = "#" + replyId;
			linkElem.textContent = ">>" + replyId;
			linkElem.classList.add("replyText")

			//for mobile
			linkElem.addEventListener('click', (linkevent) => {
				linkevent.preventDefault()
				if (linkevent.pointerType !== "touch") return;
				// console.log("pointer click")
				addPopup(linkElem, linkevent, replyId, true)
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

			fragment.appendChild(linkElem);
		});

		footerElem.appendChild(fragment);
		postNode.appendChild(footerElem)
	}
}

scrollToPost()
setReplyPost()
setShareButton()
showOP()
expandFile()
getReplies()