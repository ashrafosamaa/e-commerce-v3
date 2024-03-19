import QRCode from 'qrcode'

export async function qrCodeGeneration(data) {
    const qrCode = await QRCode.toDataURL(data, {errorCorrectionLevel: 'H'})
    return qrCode
}
