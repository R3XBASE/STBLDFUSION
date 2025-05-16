require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');

// Inisialisasi bot dengan token dari .env
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// URL endpoint Hugging Face untuk model Stable Diffusion
const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1';

// Fungsi untuk memanggil API Hugging Face
async function generateImage(prompt) {
  try {
    const response = await axios.post(
      HUGGINGFACE_API_URL,
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer', // Untuk menerima data gambar
      }
    );
    return Buffer.from(response.data); // Konversi data ke Buffer
  } catch (error) {
    console.error('Error generating image:', error.response?.data || error.message);
    throw new Error('Gagal menghasilkan gambar. Coba lagi nanti.');
  }
}

// Handler untuk perintah /start
bot.start((ctx) => {
  ctx.reply('Selamat datang! Gunakan perintah /generate <teks> untuk membuat gambar dari teks. Contoh: /generate A futuristic city at sunset');
});

// Handler untuk perintah /generate
bot.command('generate', async (ctx) => {
  const prompt = ctx.message.text.split(' ').slice(1).join(' ');
  if (!prompt) {
    return ctx.reply('Silakan masukkan deskripsi gambar. Contoh: /generate A futuristic city at sunset');
  }

  try {
    ctx.reply('Sedang menghasilkan gambar, mohon tunggu...');
    const imageBuffer = await generateImage(prompt);
    await ctx.replyWithPhoto({ source: imageBuffer });
  } catch (error) {
    ctx.reply(error.message);
  }
});

// Untuk deployment di Vercel (API route)
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } catch (error) {
      console.error('Error handling update:', error);
      res.status(500).send('Error');
    }
  } else {
    res.status(405).send('Method Not Allowed');
  }
};

// Jalankan bot secara lokal (opsional untuk testing)
if (process.env.NODE_ENV !== 'production') {
  bot.launch().then(() => console.log('Bot is running locally...'));
}