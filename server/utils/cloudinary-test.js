const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'ddjf0yqzl',
  api_key: '224653844786764',
  api_secret: '5okzsfHK8p_5LJO7keKJLPuV5ns',
});

async function run() {
  console.log('Uploading image...');
  const upload = await cloudinary.uploader.upload(
    'https://res.cloudinary.com/demo/image/upload/sample.jpg'
  );
  console.log('Secure URL:', upload.secure_url);
  console.log('Public ID: ', upload.public_id);

  const info = await cloudinary.api.resource(upload.public_id);
  console.log('\nImage details:');
  console.log('  Width:    ', info.width);
  console.log('  Height:   ', info.height);
  console.log('  Format:   ', info.format);
  console.log('  File size:', info.bytes, 'bytes');

  const transformed = cloudinary.url(upload.public_id, {
    transformation: [
      { fetch_format: 'auto' }, // serves WebP/AVIF based on browser
      { quality: 'auto' },      // reduces size without visible quality loss
    ],
  });

  console.log('\nDone! Click link below to see optimized version of the image. Check the size and the format.');
  console.log(transformed);
}

run().catch(console.error);