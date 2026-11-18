import crypto from "node:crypto";
import fs from "fs/promises"
import { AppError } from "./error.js";

export const convertToHindiDate = (isoString) => {
	return new Date(isoString)
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

export const convertHindiNumberToEnglishNumber = (num) => {
	return new Intl.NumberFormat('en-IN', {
		numberingSystem: 'latn',
		useGrouping: false
	}).format(num);
}

export const generateTripcode = (req, res, next) => {
	let name = req.body.name
	if (name.length > 0) {
		let hashIndex = name.indexOf("#")
		if (hashIndex != -1) {
			let first = name.slice(0, hashIndex)
			let second = name.slice(hashIndex + 1)
			let tripcode = crypto
				.createHash("sha256")
				.update(second.normalize("NFC"), "utf8")
				.digest("base64url")
				.slice(0, 8);
			console.log("[generateTripcode] name : ", first, " password : ", second , " tripcode : ", tripcode)
			req.body.name = first + "!" + tripcode
		}
	}
	return next()
}

let secret = null

export const generateSecret = () => {
	secret = crypto.randomUUID()
	return secret
}

export const adminRoleCheck = (req, res, next) => {
	let authString = req.cookies?.secret;
	console.log("[adminRoleCheck] browser cookie = ", authString , " Stored cookie = ", secret)
	if(authString && secret == authString) {
		return next()
	}
	throw new AppError(403, "Forbidden")
}

export const setUserRole = (req, res, next) => {
	//check the auth string
	let authString = req.cookies?.secret
	// console.log(authString)
	if(authString && secret === authString) {
		req.userRole = "ADMIN"
	} else {
		req.userRole = "USER"
	}
	return next()
}