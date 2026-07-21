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
		document.getElementById('content').value += ">>" + btn.dataset.postNumber + "\n"
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
		// Prevent default paste behavior in the textbox if desired
		event.preventDefault();
	}
});


//post data
let inter = undefined
//upload progress
document.getElementById("uploadForm")?.addEventListener("submit", function (e) {
	e.preventDefault();

	//disable submit button
	document.querySelector("button[type='submit']").disabled = true

	const form = e.target;
	const formData = new FormData(form); // Directly pass the form to FormData
	const xhr = new XMLHttpRequest();

	xhr.open("POST", window.location.href); // ← change to your upload URL

	const progressBar = document.getElementById("progressBar");
	progressBar.style.width = "100%"
	const status = document.getElementById("status");

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


	//clear interval
	if (inter) {
		clearInterval(inter)
	}
	// When upload completes
	xhr.onload = function () {

		if (xhr.status === 201) {
			progressBar.value = 100;
			status.textContent = xhr.responseText;
			setTimeout(() => {
				// window.location.hash = xhr.responseText;
				window.location.reload()
			}, 300);
		} else if (xhr.status == 429) {
			status.textContent = xhr.responseText
			const regex = /(\d+)/g
			let number = Number(xhr.responseText.match(regex)[0])
			status.textContent = `Wait ${number} seconds.`
			number--
			inter = setInterval(() => {
				status.textContent = `Wait ${number} seconds.`
				number--
				if (number < 0) {
					clearInterval(inter)
					setTimeout(() => {
						status.textContent = ''
					}, 500);
				}
			}, 1000);
		} else if (xhr.responseText) {
			status.textContent = xhr.responseText;
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

