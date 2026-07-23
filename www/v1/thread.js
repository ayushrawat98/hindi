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
			//remove expanded image from clone
			let imglist = clone.querySelectorAll("img")
			if(imglist[0]?.classList.contains("thumbnail--removed")){
				imglist[0]?.classList.toggle("thumbnail--removed")
				imglist[1]?.classList.toggle("thumbnail--removed")
			}
			
			clone.classList.add("popup")
			clone.classList.remove("post--border")

			//find true unexpanded currentPost height
			let imglistMain = currentPost.querySelectorAll("img")
			let currentPostHeight = currentPost.offsetHeight
			if(imglistMain[0]?.classList.contains("thumbnail--removed")){
				let toggle = () => {
					imglistMain[0]?.classList.toggle("thumbnail--removed")
					imglistMain[1]?.classList.toggle("thumbnail--removed")
				}
				toggle()
				currentPostHeight = currentPost.offsetHeight 
				toggle()
			}

			currentPostHeight = currentPostHeight > 300 ? 300 : currentPostHeight

			//find correct place to show popup
			if(linkevent.clientY < 330){
				//show below
				clone.style.top = `${linkevent.clientY + 20}px`;
			}else {
				clone.style.top = `${linkevent.clientY - currentPostHeight - 20}px`;
			}
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


function getReplies() {
	let postNodes = document.querySelectorAll(".board-feed__column--hot .post-list .post")

	let postMap = new Map()
	let replyArray = []

	postNodes.forEach(article => {
		const postId = article.id
		
		if(!postMap.has(postId)) {
			postMap.set(postId, [article, []]) //id, htmlelement, reply array
		}

		article.querySelectorAll(".replyLink").forEach(link => {
			replyArray.push([link.getAttribute("data-post-number-link"), postId])
		})
	})

	for(let [replyTo , replyFrom] of replyArray){
		postMap.get(replyTo)[1].push(replyFrom)
	}

	//add the links
	for(let [postId , [postNode, repliesId]] of postMap){
		if(repliesId.length === 0) continue;
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
			linkElem.style.color = "#5F7388";
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