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

const fileName = document.querySelector(".fileName")
function setFileName(str){
	fileName.innerText = str
}

//show file name on selection
document.querySelector("#file").addEventListener("change", (event) => {
	let file = event.target.files[0]
	setFileName(file.name + " - " + ((file.size)/1024).toFixed(2) + " KiB")
})

//reset event on form
document.getElementById("uploadForm").addEventListener("reset", (resetEvent) => {
	setFileName("")
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
		setFileName(imageFile.name + " - " + ((imageFile.size)/1024).toFixed(2) + " KiB")
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



// document.querySelector('input[type="file"]').addEventListener('change', async function(e) {
//     if (!this.files || this.files.length === 0) return;

//     const file = this.files[0];
    
//     // 1. Define your desired original name (or generate a unique one)
//     const originalName = "my_custom_filename.jpg"; 

//     // 2. Create a brand new File object with the original data but a new name
//     const renamedFile = new File([file], originalName, { type: file.type });

//     // 3. Pack it into FormData instead of submitting a traditional HTML form
//     const formData = new FormData();
//     formData.append('file_upload', renamedFile); // 'file_upload' matches your backend's expected field name

//     // 4. Send it to your server via Fetch API
//     try {
//         const response = await fetch('/your-upload-endpoint', {
//             method: 'POST',
//             body: formData // The browser automatically handles the Multipart/Form-Data headers
//         });
        
//         if (response.ok) {
//             console.log('Upload successful with the correct file name!');
//         }
//     } catch (error) {
//         console.error('Upload failed:', error);
//     }
// });
