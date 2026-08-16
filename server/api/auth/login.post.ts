export default defineEventHandler(async(event)=>{

	const {user} = await readBody(event)
	try {

		await setUserSession(event, {
		  user: {
		    name: user.name_english,
		    userId: user.user_id,
		    role: user.role
		  }
		})

		return user;
		
	}catch (er) {
		return er;
	}

})