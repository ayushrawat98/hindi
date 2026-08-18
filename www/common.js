window.addEventListener('load', () => {
  showName()
});

//reset value on coming back from other page
//solve bug where file is still selected when moving through pages
window.addEventListener("pageshow", (event) => {
	let file = document.querySelector("#file").files[0]
	if (!file) return;
	setFileName(file.name + " - " + ((file.size) / 1024).toFixed(2) + " KiB")
})

//form events handling
let newPostWindow = document.querySelector('.newPostWindow')
document.querySelector(".closeButton")?.addEventListener('click', () => {
	commonHideFunction()
})
document.querySelectorAll('.newPostButton').forEach(element => element.addEventListener('click', () => {
	commonHideFunction()
}))
document.querySelectorAll(".replyButton").forEach(btn => {
	btn.addEventListener('click', () => {
		newPostWindow.classList.remove('hidden')
		//if there is content add a newline before appending post number

		if (document.getElementById('content').value.trim().length > 0 && !document.getElementById('content').value.endsWith("\n")) {
			document.getElementById('content').value += "\n>>" + btn.dataset.postNumber + "\n"
		} else {
			document.getElementById('content').value += ">>" + btn.dataset.postNumber + "\n"
		}
	})
})
const commonHideFunction = () => {
	if (newPostWindow.classList.contains('hidden')) {
		newPostWindow.classList.remove('hidden')
		showName()
	} else {
		newPostWindow.classList.add('hidden')
	}
}

const fileName = document.querySelector(".fileName")
function setFileName(str) {
	fileName.textContent = str
}

//show file name on selection
document.querySelector("#file").addEventListener("change", (event) => {
	let file = event.target.files[0]
	setFileName(file.name + " - " + ((file.size) / 1024).toFixed(2) + " KiB")
})

//reset event on form
document.getElementById("uploadForm").addEventListener("reset", (resetEvent) => {
	setFileName("")
})

document.querySelector(".fakeLink").addEventListener("click", (event) => {
	document.querySelector("#file").click()
})


//paste image
const pasteTextBox = document.getElementById('content');
const imageFileInput = document.getElementById('file');
pasteTextBox?.addEventListener('paste', (event) => {
	const items = (event.clipboardData || event.originalEvent.clipboardData).items;
	let imageFile = null;

	for (let i = 0; i < items.length; i++) {
		if (items[i].type.startsWith('image/')) {
			imageFile = items[i].getAsFile();
			break; // Assuming only one image per paste
		}
	}

	if (imageFile) {
		const dataTransfer = new DataTransfer();
		dataTransfer.items.add(imageFile);
		imageFileInput.files = dataTransfer.files;
		setFileName(imageFile.name + " - " + ((imageFile.size) / 1024).toFixed(2) + " KiB")
		// Prevent default paste behavior in the textbox if desired
		event.preventDefault();
	}
});

//check if form is not selected
document.getElementById("file")?.addEventListener("invalid", (event) => {
	event.preventDefault();
	const status = document.getElementById("status");
	status.textContent = "संचिका(फाइल) आवश्यक है।"
	setTimeout(() => {
		status.textContent = ""
	}, 2000);
})

//post data
document.getElementById("uploadForm")?.addEventListener("submit", function (e) {
	e.preventDefault();

	const status = document.getElementById("status");

	//disable submit button
	document.querySelector("button[type='submit']").disabled = true

	const form = e.target;
	const formData = new FormData(form); // Directly pass the form to FormData
	const xhr = new XMLHttpRequest();
	xhr.responseType = 'json';
	xhr.open("POST", window.location.href); // ← change to your upload URL

	const progressBar = document.getElementById("progressBar");
	progressBar.style.width = "100%"


	// Track upload progress
	xhr.upload.onprogress = function (event) {
		progressBar.hidden = false
		if (event.lengthComputable) {
			const percent = (event.loaded / event.total) * 100;
			// progressBar.style.width = percent.toFixed(2) + "%";
			progressBar.value = percent.toFixed(2)
			status.textContent = `Uploading… ${percent.toFixed(0)}%`;
		}
	};

	// When upload completes
	xhr.onload = function () {

		if (xhr.status === 201) {
			if(window.location.pathname.includes("thread")) {
				let str = xhr.response.threadId + "#" + numberToHindi(xhr.response.replyId)
				appendToReplyList(str)
			}
			progressBar.value = 100;
			status.textContent = xhr.response.message;
			document.querySelector("#file").value = ""
			setTimeout(() => {
				// window.location.hash = xhr.responseText;
				window.location.reload()
			}, 300);
		} else if (xhr.status == 429) {
			status.textContent = xhr.response.message
		} else if (xhr.response) {
			status.textContent = xhr.response.message;
		} else {
			status.textContent = "Upload failed!"
		}
		document.querySelector("button[type='submit']").disabled = false
	}

	// Error handling
	xhr.onerror = function () {
		status.textContent = "Upload error!";
		document.querySelector("button[type='submit']").disabled = false
	};

	xhr.send(formData); // Send the FormData
});


//save name
document.getElementById('name').addEventListener('input', (e) => {
	localStorage.setItem('name', e.target.value)
})

function showName(){
	let name = localStorage.getItem('name')
	if(name) document.getElementById('name').value = name
}

function numberToHindi(num) {
	return new Intl.NumberFormat('hi-IN', { numberingSystem: 'deva', useGrouping: false }).format(num);
}

function appendToReplyList(str) {
	let t = localStorage.getItem("repliesId")
	t = JSON.parse(t)
	if(t){
		t.push(str)
	}else{
		t = [str]
	}
	//keep only last 25
	while(t.length > 25){
		t.shift()
	}
	localStorage.setItem("repliesId", JSON.stringify(t))
}

function setReplyList() {
	const container = document.querySelector(".board-list__items")
	let repliesId = localStorage.getItem("repliesId") //array of ids(string)
	const fragment = document.createDocumentFragment();
	if (repliesId) {
		repliesId = JSON.parse(repliesId)
		for (let id of repliesId) {
			const liElem = document.createElement("li")
			liElem.classList.add("board-list__item")
			const aElem = document.createElement("a")
			aElem.classList.add("board-list__link")
			aElem.href = "/thread/" + id
			aElem.textContent = ">>" + id.split("#")[1]
			liElem.appendChild(aElem)
			fragment.append(liElem)
		}
		container.append(fragment)
	}
}

setReplyList()