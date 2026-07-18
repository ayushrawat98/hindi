import nunjucks from 'nunjucks';

export function configNunjucks(app) {
	const nunjucksEnv = nunjucks.configure("views", {
		autoescape: true,
		express: app,
		noCache: true
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
		let regex = /^&gt;(?!&gt;)(.*?)$/gm
		let regexTwo = /&gt;&gt;([\u0966-\u096F]+)/gm
		// let regex = /^>(?!>)(.*?)$/gm
		// let regexTwo = />>(\d+)/gm
		return str.replace(regex, "<span style='color:#6F7F44'>&gt;$1</span>").replace(regexTwo, "<a class='replyLink' style='color:#5F7388' data-post-number-link='$1' href='#$1'>&gt;&gt;$1</a>")
	})

	nunjucksEnv.addFilter('hindinumber', (num) => {
		return new Intl.NumberFormat('hi-IN', { numberingSystem: 'deva', useGrouping: false }).format(num);
	})
}