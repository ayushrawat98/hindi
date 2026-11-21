
export let torExitIp = []

export const torIpBlocker = (req, res, next) => {
	console.log("[torIpBlocker] current ip : ", req.ip)
	if(torExitIp.includes(req.ip)) {
		console.log("[torIpBlocker] Tor IP blocked ", req.ip)
		return res.status(403).json({message : "तोर प्रतिबंधित है।"})
	}
	return next()
}

export async function torExitIpHandler() {
	torExitIp = await getTorExitIp()
	setInterval(async () => {
		torExitIp = await getTorExitIp()
	}, 24 * 60 * 60 * 1000)
}


async function getTorExitIp() {
	let result = []
	try {
		let response = await fetch("https://check.torproject.org/torbulkexitlist")
		response = await response.text()
		response = response.split("\n")
		result = response
		console.log("[getTorExitIp] Tor Ip fetch successful.")
	} catch (err) {
		console.log("[getTorExitIP] Error getting IP ", err.message)
	}
	return result
}
