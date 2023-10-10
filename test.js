const calId = process.env.CAL_ID;
const clientEmail = process.env.CL_EMAIL;
const privateKey = process.env.PRIV_KEY;

if (calId && clientEmail && privateKey) {
  console.log(`Calendar ID: ${calId}`);
  console.log(`Client Email: ${clientEmail}`);
  console.log(`Private Key: ${privateKey}`);
} else {
  console.error('One or more secret variables not found.');
}