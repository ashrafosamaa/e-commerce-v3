import fs from "fs";
import PDFDocument from "pdfkit";
import path from "path";
import Coupon from "../../DB/models/coupon.model.js";

async function createInvoice(invoice, pathVar) {
  let doc = new PDFDocument({ size: "A4", margin: 50 });

  generateHeader(doc);
  generateCustomerInformation(doc, invoice);
  await generateInvoiceTable(doc, invoice);
  generateFooter(doc);

  doc.end();
  doc.pipe(fs.createWriteStream(path.resolve(`./Files/${pathVar}`)));
}

function generateHeader(doc) {
  doc
    .fillColor("#444444") // black
    .fontSize(20) // 20
    .text("Otlob", 110, 57) // Route
    .fillColor("#000000")
    .fontSize(10)
    .text("Otlob", 400, 50, { align: "left" })
    .text("6, Tahrir ST", 400, 65, { align: "left" })
    .text("Cairo, Egypt", 400, 80, { align: "left" })
    .moveDown();
}

function generateCustomerInformation(doc, invoice) {
  doc.fillColor("#444444").fontSize(20).text("Invoice", 50, 160);

  generateHr(doc, 185);

  const customerInformationTop = 200;

  doc
    .fontSize(10)
    .text("Order Code:", 50, customerInformationTop)
    .font("Helvetica-Bold")
    .text(invoice.orderCode, 150, customerInformationTop)
    .font("Helvetica")
    .text("Invoice Date:", 50, customerInformationTop + 30)
    .text(formatDate(new Date(invoice.date)), 150, customerInformationTop + 30)
    .font("Helvetica-Bold")
    .font("Helvetica")
    .text("Customer Name:", 290, customerInformationTop)
    .text("Customer Address:", 290, customerInformationTop + 15)
    .font("Helvetica-Bold")
    .text(invoice.shipping.name, 400, customerInformationTop)
    .text(invoice.shipping.address, 400, customerInformationTop + 15)
    .font("Helvetica")
    .text(
      invoice.shipping.postalCode +
      ", " +
        invoice.shipping.city +
        ", " +
        invoice.shipping.country,
        400,
      customerInformationTop + 30
    )
    
    .moveDown();

  generateHr(doc, 252);
}

async function generateInvoiceTable (doc, invoice) {
  let i;
  const invoiceTableTop = 330;

  doc.font("Helvetica-Bold");
  generateTableRow(
    doc,
    invoiceTableTop,
    "Item",
    "Unit Cost",
    "Quantity",
    "Line Total"
  );
  generateHr(doc, invoiceTableTop + 20);
  doc.font("Helvetica");

  for (i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i];
    const position = invoiceTableTop + (i + 1) * 30;
    generateTableRow(
      doc,
      position,
      item.title, // product title
      formatCurrency(item.price), // product price
      item.quantity, // product quantity
      formatCurrency(item.price * item.quantity) // product final price
    );

    generateHr(doc, position + 20);
  }

  const subtotalPosition = invoiceTableTop + (i + 1) * 30;
  generateTableRow(
    doc,
    subtotalPosition,
    "",
    "",
    "Subtotal",
    "",
    formatCurrency(invoice.subTotal) // orderSubTotal
  );

  const isCoupon = await Coupon.findById(invoice.couponId)
  if(isCoupon?.isFixed == true){
    invoice.coupon = formatCurrency(invoice.coupon)
  }
  if(isCoupon?.isPercentage == true){
    invoice.coupon = `${invoice.coupon}%`
  }
  if(!invoice.coupon) {invoice.coupon = "0"} 

  const discountPosition = subtotalPosition + 20;
  generateTableRow(
    doc,
    discountPosition,
    "",
    "",
    "Discount Amount",
    "",
    invoice.coupon // orderDiscount
  );

  const paidToDatePosition = discountPosition + 20;
  generateTableRow(
    doc,
    paidToDatePosition,
    "",
    "",
    "Paid Amount",
    "",
    formatCurrency(invoice.paidAmount) // orderPaidAmount
  );

  doc.font("Helvetica");
}

function generateFooter(doc) {
  doc
    .fontSize(10)
    .text(
      "Payment is due within 15 days. Thank you for your business.",
      50,
      780,
      { align: "center", width: 500 }
    );
}

function generateTableRow(
  doc,
  y,
  item,
  description,
  unitCost,
  quantity,
  lineTotal
) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(description, 150, y)
    .text(unitCost, 280, y, { width: 90, align: "right" })
    .text(quantity, 370, y, { width: 90, align: "right" })
    .text(lineTotal, 0, y, { align: "right" });
}

function generateHr(doc, y) {
  doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
}

function formatCurrency(cents) {
  return cents + "EGP";
}

function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return year + "/" + month + "/" + day;
}

export default createInvoice;
