const { Telegraf, Markup } = require('telegraf');
const path = require('path');
const download = require('./download');
const speechToText = require('./speech-to-text');
// require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply('Hola,\nBienvenido'));
bot.command(['inicio', 'Inicio'], (ctx) => ctx.reply('Hola,\nBienvenido'));
bot.command(['ayuda', 'Ayuda'], async (ctx) => {
  const response = await ctx.reply(
    'Botones de ayuda.',
    Markup.keyboard([
      ['🔍 Prueba de velocidad lectora', 'Revisión de tarea 📚'],
      ['📢 Anuncios', '⭐️ Calificanos', 'Preguntas ❓'],
    ])
      .oneTime()
      .resize()
  );
  return response;
});

bot.hears('🔍 Prueba de velocidad lectora', (ctx) =>
  ctx.reply(
    'Envia un audio de una lectura y obtendras las cantidad de palabras.'
  )
);
bot.hears('Revisión de tarea 📚', (ctx) =>
  ctx.reply('Envia una imagen de la tarea y será calificada.')
);
bot.hears('📢 Anuncios', (ctx) => ctx.reply('No hay anuncios nuevos.'));
bot.hears('⭐️ Calificanos', (ctx) =>
  ctx.reply('Envia un numero entre 0 y 10')
);
bot.hears('Preguntas ❓', (ctx) => ctx.reply('¿Cuál es tu pregunta?'));
bot.on('voice', (ctx) => {
  const { first_name: firstName } = ctx.message.from;
  const procesandoMensaje = `Hola ${firstName} estamos procesando el audio`;
  ctx.telegram.sendMessage(ctx.message.chat.id, procesandoMensaje, {
    parse_mode: 'Markdown',
  });

  const {
    mime_type: mimeType,
    file_id: fileId,
    file_unique_id: fileUniqueId,
  } = ctx.message.voice;
  ctx.telegram.getFileLink(fileId).then((url) => {
    const { href } = url;
    if (!mimeType.endsWith('ogg')) {
      return;
    }
    const fileName = path.join(
      __dirname,
      '/audios',
      `${firstName}-${fileUniqueId}.ogg`
    );
    download(href, fileName, () =>
      speechToText(fileName)
        .then((words) => {
          ctx.telegram.sendMessage(
            ctx.message.chat.id,
            `Hemos detectado * ${words} * palabras buen trabajo.`,
            {
              parse_mode: 'Markdown',
            }
          );
        })
        .catch((err) => {
          throw new Error(`El audio no puedo ser procesado. ${err.message}`);
        })
    );
  });
});
bot.on('text', (ctx) => {
  //do something
});
bot.on('sticker', (ctx) => {
  ctx.reply('👍');
});
bot.on('photo', (ctx) => {});

bot.on('audio', (ctx) => {
  const {
    message: { caption },
  } = ctx;
  const { first_name: fistName } = ctx.message.from;
  let procesandoMensaje = `Hola ${fistName} estamos procesando el audio`;
  if (caption) {
    procesandoMensaje += `, con titulo: * ${caption} *`;
  }
  ctx.telegram.sendMessage(ctx.message.chat.id, procesandoMensaje, {
    parse_mode: 'Markdown',
  });

  const {
    mime_type: mimeType,
    file_name: fileName,
    file_id: fileId,
  } = ctx.message.audio;
  ctx.telegram.getFileLink(fileId).then((url) => {
    const { href } = url;
    download(href, `./${fileName}`, () => console.log('downloaded'));
  });
});
bot.hears(['hi', 'hola'], (ctx) => {
  ctx.reply('Hola.');
});
bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
