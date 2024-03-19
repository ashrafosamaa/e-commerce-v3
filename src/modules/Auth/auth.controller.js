import { generateOTP } from "../../utils/generate-unique-string.js"
import {OAuth2Client} from  'google-auth-library' ;
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

import User from "../../../DB/models/user.model.js"
import sendEmailService from "../services/send-email.service.js"

export const signUp = async (req, res, next)=> {
    // destruct data from req.body
    const{
        username,
        email,
        password,
        phoneNumbers,
        addresses,
        role,
        age,
    } = req.body
    // check if user already exists
    const isEmailExist = await User.findOne({email})
    if(isEmailExist){
        return res.status(409).json({
            msg: "Email is already exists, Please try another email"
        })
    }
    // password hashing
    const hashedPassword = bcrypt.hashSync(password, +process.env.SALT_ROUNDS)
    // create new document in database
    const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        phoneNumbers, 
        addresses,
        role,
        age
    })
    req.savedDocument = {model: User, _id: newUser._id}
    //generate token
    const userToken = jwt.sign({email}, process.env.JWT_SECRET_VERFICATION, {expiresIn: "2m"})
    // send email
    const isEmailSent = await sendEmailService({
        to: email,
        subject: "Welcome To E-commerce",
        message: `<h4>Click the link below to verify your email</h4>
        <a href="${req.protocol}://${req.headers.host}/auth/verify-email?token=${userToken}">Verify your account</a>`,
    })
    //check email is sent or not
    if(!isEmailSent){
        return res.status(500).json({
            msg: "Failed to send email, Please try again later"
        })
    }
    // send response
    res.status(201).json({
        msg: "User created successfully, Please check your email to verify your account" 
    })
}

export const verifyEmail = async (req, res, next)=> {
    const { token } = req.query
    if(!token){
        return res.status(400).json({
            msg: "Please provide a token"
        })
    }
    // verify token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_VERFICATION)
    //get user by email , isEmailVerified: false
    const user = await User.findOne({email: decodedToken.email})
    if(!user){
        return res.status(404).json({
            msg: "User not found"
        })
    }
    if(user.isEmailVerified){
        return res.status(400).json({
            msg: "User already verified"
        })
    }
    // update user
    user.isEmailVerified = true
    await user.save()
    // send response
    res.status(200).json({
        msg: "User verified successfully, Please try to login",
    })
}

export const singIn = async (req, res, next)=> {
    //destruct data from req.body
    const{email, password} = req.body
    // check if user exists
    const user = await User.findOne({email})
    if(!user){
        return res.status(404).json({
            msg: "Invalid login credentails"
        })
    }
    const isVerifiedEmail = user.isEmailVerified
    if(!isVerifiedEmail){
        return res.status(404).json({
            msg: "Please Verify your account first"
        })
    }
    // compare password
    const isPasswordMatch = bcrypt.compareSync(password, user.password);
    if (!isPasswordMatch) {
        return res.status(400).json({
            msg: "Invalid login credentials"
        });
    }
    // generate token
    const userToken = jwt.sign({ id: user._id ,email , username: user.username }, 
        process.env.JWT_SECRET_LOGIN, 
        {
            expiresIn: "1d"
        }
    )
    user.isLoggedIn = true
    if(user.softDelete == true){
        await sendEmailService({
            to: email,
            subject: "Welcome To E-commerce",
            message: '<h4>Welcome back! We are happy to have you back</h4>'
        })
        user.softDelete = false
    }
    await user.save()
    // send response
    res.status(200).json({
        msg: "User logged in successfully",
        userToken,
    })
}

export const getAccountData = async (req, res, next)=> {
    // destruct data from user
    const {_id} = req.authUser
    const {userId} = req.params
    if(_id != userId){
        return res.status(400).json({msg: "You cannot get this profile data"})
    }
    // get user data
    const getUser = await User.findById(_id).select("-password -_id -createdAt -updatedAt -__v -isLoggedIn -isEmailVerified")
    if (!getUser) {
        return res.status(404).json({
            msg: "User not found"
        })
    }
    // send response
    res.status(200).json({
        msg: "User data fetched successfully",
        getUser
    })
}

export const updateProfileData = async (req, res, next)=> {
    // destruct data from user
    const {_id} = req.authUser
    const {userId} = req.params
    const{ 
        username,
        email,
        phoneNumbers,
        addresses,
        age,
    } = req.body
    // check who is login and who is updating
    if(_id != userId){
        return res.status(400).json({msg: "You cannot update this profile's data"})
    }
    // check if email duplicate
    const isEmailDuplicate = await User.findOne({ email, _id: { $ne: _id } })
    if (isEmailDuplicate) {
        return res.status(409).json({
            msg: "Email is already exists, Please try another email"
        })
    }
    // update user data
    const updateUser = await User.findByIdAndUpdate(_id, {
        username,
        email,
        phoneNumbers,
        addresses,
        age,
    }, {new: true}).select("-password -_id -createdAt -updatedAt -__v -isLoggedIn -isEmailVerified")
    // send email
    const isEmailSent = await sendEmailService({
        to: updateUser.email,
        subject: "Welcome To E-commerce",
        message: '<h4>Your account data has been updated successfully</h4>'
    })
    if (!updateUser) {
        return res.status(404).json({
            msg: "Update failed"
        })
    }
    // send response
    res.status(200).json({
        msg: "User data updated successfully",
        updateUser
    })
}

export const updatePassword = async (req, res, next)=> {
    // destruct data from user
    const {_id} = req.authUser
    const {userId} = req.params
    const {password, oldPassword} = req.body
    if(_id != userId){
        return res.status(400).json({msg: "You cannot update this profile's data"})
    }
    // hash password
    const hashedPassword = bcrypt.hashSync(password, +process.env.SALT_ROUNDS)
    // find user
    const user = await User.findById(_id)
    // check old password
    const isPasswordMatch = bcrypt.compareSync(oldPassword, user.password)
    if(!isPasswordMatch){
        return res.status(400).json({
            msg: "Invalid old password"
        })
    }
    // update user data
    user.password = hashedPassword
    await user.save()
    // send email
    const isEmailSent = await sendEmailService({
        to: user.email,
        subject: "Welcome To E-commerce",
        message: '<h4>Your password has been updated successfully</h4>'
    })
    // send response
    res.status(200).json({
        msg: "User password updated successfully",
        user
    })
}

export const forgetPassword = async (req, res, next)=> {
    // destruct data from user
    const {email} = req.body
    // find user
    const user = await User.findOne({email})
    if(!user){
        return res.status(404).json({
            msg: "User not found"
        })
    }
    // set forget code
    const otp = generateOTP(6)
    const hashedOtp = bcrypt.hashSync(otp, +process.env.SALT_ROUNDS)
    // set token
    const token = jwt.sign(
        {email, sentCode: hashedOtp }, 
        process.env.JWT_SECRET_LOGIN, 
        {
            expiresIn: "1h"
        }
    )
    // reset password link
    const resetPasswordLink = `${req.protocol}://${req.headers.host}/auth/reset/${token}`
    // send email
    const isEmailSent = await sendEmailService({
        to: user.email,
        subject: "Welcome To E-commerce",
        message: `<h4>Click the link below to reset your password</h4>
        <a href= ${resetPasswordLink}> Reset your Password </a>`})
    if (!isEmailSent) {
        return res.status(404).json({
            msg: "Email not sent"
        })
    }
    // update user data
    user.forgetCode = hashedOtp
    await user.save()
    // send response
    res.status(200).json({
        msg: "Reset password link has been sent to your email",
    })
}

export const resetPassword = async (req, res, next)=> {
    // destruct data from user
    const {token} = req.params
    const {newPassword} = req.body
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_LOGIN)
    // find user
    const user = await User.findOne({email: decodedToken?.email, forgetCode: decodedToken?.sentCode})
    if(!user){
        return res.status(404).json({
            msg: "You already reset your password"
        })
    }
    // hash password
    const hashedPassword = bcrypt.hashSync(newPassword, +process.env.SALT_ROUNDS)
    user.forgetCode = null
    user.password = hashedPassword
    // update user data
    await user.save()
    // send email with updates
    const isEmailSent = await sendEmailService({
        to: user.email,
        subject: "Welcome To E-commerce",
        message: '<h4>Your password has been updated successfully</h4>'
    })
    // send response
    res.status(200).json({
        msg: "User password updated successfully, try to login",
    })
}

export const deleteAccount = async (req, res, next)=> {
    // destruct data from user
    const {_id} = req.authUser
    const {email} = req.authUser
    const {userId} = req.params
    if(_id != userId){
        return res.status(400).json({msg: "You cannot delete this profile"})
    }
    // delete user data
    const deleteUser = await User.findByIdAndDelete(_id)
    // send email
    const isEmailSent = await sendEmailService({
        to: email,
        subject: "Welcome To E-commerce",
        message: '<h4>Your account has been deleted successfully</h4>'
    })
    if (deleteUser.deletedCount == 0 || !deleteUser) {
        return res.status(404).json({
            msg: "Delete failed"
        })
    }
    // send response
    res.status(200).json({
        msg: "User deleted successfully",
    })
}

export const softDelete = async (req, res, next)=> {
    // destruct data from user
    const {_id} = req.authUser
    const {userId} = req.params
    if(_id != userId){
        return res.status(400).json({msg: "You cannot De-Activate this profile"})
    }
    // update user data
    const updateUser = await User.findByIdAndUpdate(_id, {
        softDelete: true
    })
    // send email
    const isEmailSent = await sendEmailService({
        to: updateUser.email,
        subject: "Welcome To E-commerce",
        message: '<h4>Your account has been De-Activated successfully</h4>'
    })
    // check if user deactivated
    if (!updateUser) {
        return res.status(404).json({
            msg: "De-Activate failed"
        })
    }
    // send response
    res.status(200).json({
        msg: "User deactivated successfully"
    })
}

export const logout = async (req, res, next)=> {
    // destruct data from user
    const {_id} = req.authUser
    const {userId} = req.params
    if(_id != userId){
        return res.status(400).json({msg: "You cannot logout this profile"})
    }
    // update user data
    const updateUser = await User.findByIdAndUpdate(_id, {
        isLoggedIn: false
    })
    // check if user logout
    if (!updateUser) {
        return res.status(404).json({
            msg: "Logout failed"
        })
    }
    // send response
    res.status(200).json({
        msg: "User logged out successfully"
    })
}

export const loginWithGmail = async (req, res, next) => {
    // req.body.idToken
    const { idToken } = req.body
    const client = new OAuth2Client();
    async function verify() {
    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.CLIENT_1_ID,
    });
    const payload = ticket.getPayload();
    return payload
    }
    const result = await verify().catch(console.error);
    if(!result.email_verified) return next(new Error('Email not verified, please enter another google email', { cause: 400 }))
    // get user by email
    const user = await User.findOne({ email:result.email , provider:'google'})
    if (!user) {
        console.log('Invalid login credentails');
        return next(new Error('Invalid login credentails', { cause: 404 }))
    }
    // generate login token
    const token = jwt.sign({ 
        email:result.email , id: user._id, loggedIn: true },
            process.env.JWT_SECRET_LOGIN,
            { expiresIn: '1d' })
    // updated isLoggedIn = true  in database
    user.isLoggedIn = true
    await user.save()
    // send response
    res.status(200).json({
        success: true,
        message: 'User logged in successfully',
        data: {
            token
        }
    })
}

export const signUpWithGmail = async (req, res, next) => {
    const { idToken } = req.body
    const client = new OAuth2Client();
    async function verify() {
    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.CLIENT_1_ID,
    });
    const payload = ticket.getPayload();
    return payload
    }
    const result = await verify().catch(console.error);
    if(!result.email_verified) return next(new Error('Email not verified, please enter another google email', { cause: 400 }))
    // check if the user already exists in the database using the email
    const isEmailDuplicated = await User.findOne({ email:result.email })
    if (isEmailDuplicated) {
        return next(new Error('Email already exists,Please try another email', { cause: 409 }))
    }
    // password hashing
    const randomPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = bcrypt.hashSync(randomPassword, +process.env.SALT_ROUNDS)
    // create new document in the database
    const newUser = await User.create({
        username:result.name,
        email:result.email,
        password: hashedPassword,
        isEmailVerified:true,
        provider:'google'
    })
    // return the response
    res.status(201).json({
        success: true,
        message: 'User created successfully, please login and complete your profile',
        data: newUser
    })
}