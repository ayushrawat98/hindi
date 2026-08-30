const INPUT_FILE_ELEM = document.querySelector("#file")
const NEW_POST_WINDOW_ELEM = document.querySelector('.newPostWindow')
const TEXTAREA_ELEM = document.getElementById('content');
const fileNameHolder = document.querySelector(".fileName")

const formStatus = document.getElementById("status");

window.addEventListener('load', () => {
	// showName()
});

//reset value on coming back from other page
//solve file is still selected when moving through pages
window.addEventListener("pageshow", (event) => {
	INPUT_FILE_ELEM.value = ""
})

//form events handling
document.querySelectorAll('.newPostButton').forEach(element => element.addEventListener('click', () => {
	commonHideFunction()
}))

document.querySelectorAll(".post__reply").forEach(btn => {
	btn.addEventListener('click', () => {
		NEW_POST_WINDOW_ELEM.classList.remove('hidden')
		//if there is content add a newline before appending post number
		if (TEXTAREA_ELEM.value.trim().length > 0 && !TEXTAREA_ELEM.value.endsWith("\n")) {
			TEXTAREA_ELEM.value += "\n>>" + btn.dataset.postNumber + "\n"
		} else {
			TEXTAREA_ELEM.value += ">>" + btn.dataset.postNumber + "\n"
		}
	})
})

const commonHideFunction = () => {
	NEW_POST_WINDOW_ELEM.classList.toggle('hidden')
}

//show file name on selection
INPUT_FILE_ELEM.addEventListener("change", (event) => {
	let file = event.target.files[0]
	fileNameHolder.textContent = file.name + " - " + ((file.size) / 1024).toFixed(2) + " KiB"
})

//reset event on form
document.getElementById("uploadForm").addEventListener("reset", (resetEvent) => {
	fileNameHolder.textContent = ""
})

document.querySelector(".fileButton").addEventListener("click", (event) => {
	INPUT_FILE_ELEM.click()
})

//paste image
TEXTAREA_ELEM?.addEventListener('paste', (event) => {
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
		INPUT_FILE_ELEM.files = dataTransfer.files;
		fileNameHolder.textContent = imageFile.name + " - " + ((imageFile.size) / 1024).toFixed(2) + " KiB"
		// Prevent default paste behavior in the textbox if desired
		event.preventDefault();
	}
});

//check if form is not selected
INPUT_FILE_ELEM.addEventListener("invalid", (event) => {
	event.preventDefault();
	formStatus.textContent = "संचिका(फाइल) आवश्यक है।"
	setTimeout(() => {
		formStatus.textContent = ""
	}, 2000);
})

//post data
document.getElementById("uploadForm")?.addEventListener("submit", function (e) {
	e.preventDefault();

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
			progressBar.value = percent.toFixed(2)
			formStatus.textContent = `Uploading… ${percent.toFixed(0)}%`;
		}
	};

	// When upload completes
	xhr.onload = function () {

		if (xhr.status === 201) {
			progressBar.value = 100;
			formStatus.textContent = xhr.response.message;
			INPUT_FILE_ELEM.value = ""
			setTimeout(() => {
				// window.location.hash = xhr.responseText;
				window.location.reload()
			}, 300);
		} else if (xhr.status == 429) {
			formStatus.textContent = xhr.response.message
		} else if (xhr.response) {
			formStatus.textContent = xhr.response.message;
		} else {
			formStatus.textContent = "Upload failed!"
		}
		document.querySelector("button[type='submit']").disabled = false
	}

	// Error handling
	xhr.onerror = function () {
		formStatus.textContent = "Upload error!";
		document.querySelector("button[type='submit']").disabled = false
	};

	xhr.send(formData); // Send the FormData
});


//save name
// document.getElementById('name').addEventListener('input', (e) => {
// 	localStorage.setItem('name', e.target.value)
// })

function showName() {
	let name = localStorage.getItem('name')
	if (name) document.getElementById('name').value = name
}

function addObserver() {
	const options = {
		threshold: 0.0,
		rootMargin: '200px 0px 200px 0px',
	}
	const callback = (entries, observer) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				if (!entry.target.src) {
					entry.target.src = entry.target.dataset.src
				}
				observer.unobserve(entry.target);
			}
		})
	}
	const observer = new IntersectionObserver(callback, options)
	document.querySelectorAll(".thumbnail-js").forEach(thumbnail => observer.observe(thumbnail))
}

addObserver()