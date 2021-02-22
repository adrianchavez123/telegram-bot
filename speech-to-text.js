const fs = require('fs');
const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');
const { IamAuthenticator } = require('ibm-watson/auth');
require('dotenv').config();

const speechToText = new SpeechToTextV1({
  authenticator: new IamAuthenticator({
    apikey: process.env.WATSON_SPEECH_TO_TEXT_API,
  }),
  serviceUrl: process.env.WATSON_SPEECH_TO_TEXT_URL,
});
module.exports = function (fileName) {
  const params2 = {
    objectMode: true,
    contentType: 'audio/ogg',
    model: 'es-MX_BroadbandModel',
    maxAlternatives: 0,
    audio: fs.createReadStream(fileName),
  };
  return new Promise((resolve, reject) => {
    speechToText
      .recognize(params2)
      .then((speechRecognitionResults) => {
        const transcripts = speechRecognitionResults.result.results
          .map((result) =>
            result.alternatives
              .map((r) => {
                const words = r.transcript.split(' ');
                return words.length;
              })
              .join(',')
          )
          .join(',');
        const words = transcripts.split(',').sort((a, b) => a < b);
        resolve(words[0]);
      })
      .catch((err) => {
        reject(err);
      });
  });
};
