const mySecretVariable = process.env.GITHUB_SECRET_MY_SECRET_VARIABLE;

if (mySecretVariable) {
  console.log(`My secret variable is: ${mySecretVariable}`);
} else {
  console.error('Secret variable not found.');
}