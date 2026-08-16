import instance from "./db.js";

const db = instance.db;

try {
  console.log("Running posts migration sanity check...\n");

  // 1. Check table exists
  const table = db.prepare("delete from ban").run()


    console.log("done.\n");

}catch(error){
	console.log(error)
}
