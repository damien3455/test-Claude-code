const express = require('express');
const multer = require('multer');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const client = new Anthropic();

app.use(express.static('public'));
app.use(express.json());

app.post('/api/analyze', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucune image fournie' });
  }

  const base64Image = req.file.buffer.toString('base64');
  const mediaType = req.file.mimetype;

  const prompt = `Tu es un expert en nutrition. Analyse cette photo de repas et fournis une estimation précise.

Réponds UNIQUEMENT avec un JSON valide dans ce format exact (sans texte avant ou après) :
{
  "aliments": [
    {
      "nom": "nom de l'aliment",
      "quantite": "estimation de la quantité (ex: 150g, 1 portion)",
      "calories": nombre,
      "proteines": nombre
    }
  ],
  "total_calories": nombre,
  "total_proteines": nombre,
  "remarques": "conseils nutritionnels courts ou remarques sur le repas"
}

Les valeurs de calories et protéines doivent être des nombres entiers. Les protéines sont en grammes.`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    const text = response.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Réponse invalide de Claude');
    }
    const data = JSON.parse(jsonMatch[0]);
    res.json(data);
  } catch (err) {
    console.error('Erreur analyse:', err);
    res.status(500).json({ error: "Erreur lors de l'analyse de l'image" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
