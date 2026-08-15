import instance from "../../db/db.js";

export function convertIP(clientIp) {

	// Normalize IPv4-mapped IPv6 addresses (e.g., ::ffff:192.168.1.1)
	if (clientIp.startsWith('::ffff:')) {
		clientIp = clientIp.replace('::ffff:', '');
	}

	if (clientIp.includes('.')) {
		// IPv4 logic: Extract first two octets
		const octets = clientIp.split('.');
		if (octets.length >= 2) {
			const ipv4Prefix = `${octets[0]}.${octets[1]}`;
			return ipv4Prefix
		}
	} else if (clientIp.includes(':')) {
		// IPv6 logic: Extract first two blocks
		const blocks = clientIp.split(':');
		if (blocks.length >= 2) {
			// Helper to remove leading zeros (e.g., "0db8" -> "db8", "0000" -> "0")
			const normalize = (block) => block.toLowerCase().replace(/^0+/, '') || '0';

			const ipv6Prefix = `${normalize(blocks[0])}:${normalize(blocks[1])}`;
			return ipv6Prefix
		}
	}
}
export const ipBanMiddleware = (req, res, next) => {
	let clientIp = req.ip || req.connection.remoteAddress;

	const convertedIP = convertIP(clientIp)

	console.error("converted ip ", clientIp, convertedIP)

	const isBanned = instance.queries.getBanByIp.get(convertedIP)
	
	if (isBanned) {
		console.error("banned", isBanned)
		return res.status(403).send({ message: "वापिस जाइए।" });
	}

	next();
};