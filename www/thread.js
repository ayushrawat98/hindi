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
	document.querySelectorAll('.replyLink').forEach((link) => {
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
	let oldClone = undefined
	list.forEach(link => {
		link.addEventListener('click', (linkevent) => {
			linkevent.preventDefault()


			if (oldClone) {
				oldClone.remove()
			}
			let postHash = link.getAttribute('data-post-number-link')

			const currentPost = document.getElementById(postHash)
			if (!postHash) return;
			if (!currentPost) {
				link.style.color = 'gray'
				return;
			}

			let overlay = document.createElement('div');
			overlay.classList.add("overlay")
			let clone = currentPost.cloneNode(true)
			clone.classList.add("popup")
			clone.classList.remove("post--border")
			// if (window.innerWidth < 768) {
			// let h = currentPost.offsetHeight > 350 ? 350 : currentPost.offsetHeight
			// let off = 0
			// if (linkevent.clientY < 360) {
			// 	window.scrollBy(0, -(360 - linkevent.clientY))
			// 	off = 360 - linkevent.clientY
			// }
			// clone.style.top = `${linkevent.clientY - h - 20 + off }px`;
			// }
			
			 let h = currentPost.offsetHeight > 350 ? 350 : currentPost.offsetHeight
			clone.style.top = `${linkevent.clientY - h - 20}px`;
			clone.style.left = currentPost.offsetLeft + "px"
			clone.style.width = currentPost.offsetWidth + "px"
			overlay.addEventListener('click', (e) => {
				// Only close if the user clicks the overlay itself, not the clone content
				if (e.target === overlay) {
					overlay.remove();
					oldClone = undefined;
				}
			});
			overlay.appendChild(clone);
			document.querySelector('.board-feed__column--hot').appendChild(overlay)
			oldClone = clone
		})
	})
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

scrollToPost()
setReplyPost()
setShareButton()
showOP()
expandFile()