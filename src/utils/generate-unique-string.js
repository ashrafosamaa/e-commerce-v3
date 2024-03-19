import { customAlphabet } from 'nanoid'

const generateUniqueString = (length) => {
    const nanoid = customAlphabet('12345abcd', length || 10)
    return nanoid()
}
export const generateOTP = (length) => {
    const nanoid = customAlphabet('123456', length || 10)
    return nanoid()
}


export default generateUniqueString