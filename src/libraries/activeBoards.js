import instance from "../../db/db.js"
let activeBoardsList = []
activeBoardsList = instance.queries.getBoards.all()
// console.log(activeBoardsList)
export default activeBoardsList


// const boards2 = [
// 	"सर्व",
//   "चर्चा",       // General
//   "समाचार",     // News
//   "राजनीति",    // Politics
//   "मनोरंजन",    // Entertainment
//   "खेल",        // Gaming
//   "प्रौद्योगिकी", // Technology
//   "शिक्षा",      // Education
//   "व्यापार",     // Business
//   "भोजन",       // Food
//   "आरोग्य",     // Health & Fitness
//   "वाहन",       // Vehicles
//   "यात्रा"       // Travel
// ];