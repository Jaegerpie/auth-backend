import { asyncHandler } from "../utils/syncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccessAndRefreshTokens = async(userId)=>
{
    try
    {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}
    }

    catch(error)
    {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")

    }
}


const registerUser = asyncHandler( async(req, res)=> {
    //1 get user details from frontend
    //2 validation - not empty
    //3 check if user already exists: username, email
    //4 check for images, avatars
    //5 upload them to cloudinary, avatar
    //6 create user object - create entry in db
    //7 remove password and refresh token field from response
    //8 check for user creation
    //9 return res

    const {fullName, email, username, password} = req.body   //1  
    console.log("email: ", email)
    if(!fullName || !email || !username || password ==="")  //2
    {
        throw new ApiError(400,"All fields are required")
    }

    const existedUser= await User.findOne({      //3
        $or: [{username},{email}]
    })

    console.log(fullName)

    if(existedUser)     //3
    {
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;     //4
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;   //4

    if(!avatarLocalPath)     //4
    {
        throw new ApiError(400,"Avatar file is required")
    }
    console.log(avatarLocalPath)

    const avatar = await uploadOnCloudinary(avatarLocalPath)     //5
    const coverImage = await uploadOnCloudinary(coverImageLocalPath) //5

    if(!avatar)
    {
        throw new ApiError(400, "Avatar file is required 1");
    }

    console.log(avatar)

    const user = await User.create({      //6
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"       //7
    )

    if(!createdUser)         //8
    {
        throw new ApiError(500," Something went wrong while registering the user")
    }

    return res.status(201).json(      //9
        new ApiResponse(201,createdUser,"User registered Succesfully")
    )




})






const loginUser = asyncHandler( async (req,res)=>{

    //1 req.body-> data
    //2 username or email
    //3 find the user
    //4 password check
    //5 access and refresh token
    //6 send cookie



    const {email, username, password} = req.body
    console.log(username)

    if( !username && !email)
    {
        throw new ApiError(400, "username or email is required")

    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user)
    {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) 
    {
        throw new ApiError(401, "Invalid user credentials");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secret: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In successfully"
        )
    )


})








const logoutUser = asyncHandler( async(req,res)=>{

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged Out"))


})




export {
    registerUser,
    loginUser,
    logoutUser 
}