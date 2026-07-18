import { AppError } from "./error.js";

export function escapeHTML(str) {
	let safeString = "", i = 0, ch;
	for (; i < str.length; i++) {
		ch = str[i];
		if (ch === '<') safeString += '&lt;';
		else if (ch === '>') safeString += '&gt;';
		else if (ch === '&') safeString += '&amp;';
		else if (ch === '"') safeString += '&quot;';
		else if (ch === "'") safeString += '&#39;';
		else safeString += ch;
	}
	return safeString;
}

export const trimBody = (req, res, next) => {
	req.body.title = (req.body.title ?? "").trim()
	req.body.name = (req.body.name ?? "").trim()
	req.body.content = (req.body.content ?? "").trim()
	next()
}

const hindiPostRegex = /^[\p{Script=Devanagari}\s\p{P}\p{S}\u0966-\u096F\p{Extended_Pictographic}\u200D\uFE0F]+$/u;
const urlRegex = /^https?:\/\/\S+$/iu;

export const hindiCheck = (req, res, next) => {
	let checks = [{e : "name", h: "नाम"}, {e:"content", h : "विवरण"}]
	if(req.path.includes("board")) checks.push({e:"title",h:"शीर्षक"});
	//add space before and after a link
	req.body.content = req.body.content.replace(urlRegex, ' $& ');

	for(let field of checks) {
		console.log(req.body[field.e].split(/\s+/),  req.body[field.e].split(/\s+/).every(word => hindiPostRegex.test(word)))
		if(req.body[field.e].length > 0 && !req.body[field.e].split(/\s+/).every(word => hindiPostRegex.test(word) || urlRegex.test(word))) {
			throw new AppError(400,`${field.h} हिन्दी में लिखिए।`, true)
		}
	}
	
	next()
}