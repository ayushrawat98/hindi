import nunjucks from 'nunjucks';
import { convertHindiNumberToEnglishNumber, convertToHindiDate } from './common.js';

export function configNunjucks(app) {
	const nunjucksEnv = nunjucks.configure("views", {
		autoescape: true,
		express: app,
		noCache: true
	});

	//filter for getting indian date
	nunjucksEnv.addFilter('indianDate', convertToHindiDate)

	nunjucksEnv.addFilter('greenText', (str) => {
		const greenTextRegex = /^&gt;(?!&gt;)(.*?)$/gm
		const replyLinkRegex = /&gt;&gt;([\u0966-\u096F]+)/gm
		// const boldTextRegex = /\*(.*)\*/gm
		// const urlRegex = /(https?:\/\/\S+)/iugm;
		// let regex = /^>(?!>)(.*?)$/gm
		// let regexTwo = />>(\d+)/gm
		return str
			.replace(greenTextRegex, "<span class='greenText'>&gt;$1</span>")
			.replace(replyLinkRegex, (match, num) => {

				const englishNumber = num.replace(/[०-९]/g, d =>
					'०१२३४५६७८९'.indexOf(d)
				);

				return `<span><a class='replyLink' data-post-hindi-id=${num} data-post-id='${englishNumber}' href='#${englishNumber}'>&gt;&gt;${num}</a></span>`
			})
		// .replace(urlRegex, "<a href='$1'>लिंक</a>")
		// .replace(boldTextRegex, "<span class='post__reply--bold'>$1</span>")
	})
	
	nunjucksEnv.addFilter('hindinumber', (num) => {
		return new Intl.NumberFormat('hi-IN', { numberingSystem: 'deva', useGrouping: false }).format(num);
	})


	nunjucksEnv.addFilter('safeFileName', (name) => {
		return encodeURIComponent(name)
	})


}