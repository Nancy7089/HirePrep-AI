import jwt from "jsonwebtoken"

export const isAuth = async (req,res,next)=>{
   try{
       let {token} =req.cookies
       if(!token){
        return res.status(400).json({message:"user does not have a token"})
       }
   const verifyToken = jwt.verify(token, process.env.JWT_SECRET);
req.user = verifyToken.userId;
next();



   }catch(error){
return res.status(500).json({ message: `Isauth error ${error}` });
   }
}
export default isAuth