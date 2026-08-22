import nunjucks from 'nunjucks';

export function configNunjucks(app) {
	const nunjucksEnv = nunjucks.configure("views", {
		autoescape: true,
		express: app,
		noCache: false
	});

	//filter for getting indian date
	nunjucksEnv.addFilter('indianDate', (dateString) => {
		return new Date(dateString)
			.toLocaleString("hi-IN",
				{
					timeZone: "Asia/Kolkata",
					numberingSystem: "deva",
					year: "2-digit",
					month: "numeric",
					day: "numeric",
					hour: "2-digit",
					minute: "2-digit"
				}
			)
			.replace(/am/gi, 'पूर्व').replace(/pm/gi, 'सायं')
	}
	)

	nunjucksEnv.addFilter('greenText', (str) => {
		const greenTextRegex = /^&gt;(?!&gt;)(.*?)$/gm
		const replyTextRegex = /&gt;&gt;([\u0966-\u096F]+)/gm
		const urlRegex = /(https?:\/\/\S+)/iugm;
		// let regex = /^>(?!>)(.*?)$/gm
		// let regexTwo = />>(\d+)/gm
		return str
				.replace(greenTextRegex, "<span class='greenText'>&gt;$1</span>")
				.replace(replyTextRegex, "<span><a class='replyText' data-post-number-link='$1' href='#$1'>&gt;&gt;$1</a></span>")
				.replace(urlRegex, "<a href='$1'>लिंक</a>")
	})

	nunjucksEnv.addFilter('hindinumber', (num) => {
		return new Intl.NumberFormat('hi-IN', { numberingSystem: 'deva', useGrouping: false }).format(num);
	})

	nunjucksEnv.addFilter('safeFileName', (name) => {
		return encodeURIComponent(name)
	})

	
}