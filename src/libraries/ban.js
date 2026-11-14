import instance from "../../models/db.js";
import { convertToHindiDate } from "./common.js";
import ipaddr from "ipaddr.js";

export function convertIpNew(ip) {
	let parsedIP = ipaddr.parse(ip)
	let normalizedString = parsedIP.toNormalizedString()
	if(parsedIP.kind == "ipv4") {
		return normalizedString.split(".").slice(0, 3).join(".")
	} else {
		return normalizedString.split(":").slice(0, 7).join(":")
	}
}

// export function convertIP(clientIp) {

// 	// Normalize IPv4-mapped IPv6 addresses (e.g., ::ffff:192.168.1.1)
// 	if (clientIp.startsWith('::ffff:')) {
// 		clientIp = clientIp.replace('::ffff:', '');
// 	}

// 	if (clientIp.includes('.')) {
// 		// IPv4 logic: Extract first two octets
// 		const octets = clientIp.split('.');
// 		if (octets.length >= 3) {
// 			const ipv4Prefix = `${octets[0]}.${octets[1]}.${octets[2]}`;
// 			return ipv4Prefix
// 		}
// 	} else if (clientIp.includes(':')) {
// 		// IPv6 logic: Extract first two blocks
// 		const blocks = clientIp.split(':');
// 		if (blocks.length >= 3) {
// 			// Helper to remove leading zeros (e.g., "0db8" -> "db8", "0000" -> "0")
// 			const normalize = (block) => block.toLowerCase().replace(/^0+/, '') || '0';

// 			const ipv6Prefix = `${normalize(blocks[0])}:${normalize(blocks[1])}:${normalize(blocks[2])}`;
// 			return ipv6Prefix
// 		}
// 	}
// }

export const checkBan = (req, res, next) => {
	
	let clientIp = req.ip || req.connection.remoteAddress;

	const convertedIP = convertIpNew(clientIp)

	console.log("[checkBan] Original IP : ", clientIp , " Converted IP : ", convertedIP)

	const ban = instance.queries.getBanByIp.get(convertedIP)
	
	if (ban) {
		const bannedTime = new Date(ban.ban_time).getTime()
		const currentTime = new Date().getTime()
		if(currentTime < bannedTime) {
			console.log("[checkBan] Banned", ban)
			return res.status(403).send({ message: `आप ${convertToHindiDate(ban.ban_time)} तक प्रतिबंधित हैं।` });
		}
	}

	return next();
};