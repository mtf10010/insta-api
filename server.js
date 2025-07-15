const express = require("express");
const cors = require("cors");

// Suporte a fetch para Node.js versões anteriores a 18
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(express.json());
app.use(cors());

app.post("/api/profile", async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: "username é obrigatório" });
  }

  try {
    const response = await fetch(`https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
      headers: {
        "x-ig-app-id": "936619743392459",
        "User-Agent": "Mozilla/5.0"
      }
    });

    const json = await response.json();
    const user = json.data.user;

    const result = {
      username: user.username,
      full_name: user.full_name,
      biography: user.biography,
      profile_pic_url: user.profile_pic_url,
      is_private: user.is_private,
      posts: user.edge_owner_to_timeline_media.count,
      followers: user.edge_followed_by.count,
      following: user.edge_follow.count,
    };

    if (!user.is_private) {
      result.feed = user.edge_owner_to_timeline_media.edges.map(e => ({
        image: e.node.display_url,
        id: e.node.id
      }));
    }

    res.json(result);

  } catch (err) {
    console.error("Erro:", err);
    res.status(500).json({ error: "Falha ao buscar perfil" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 API rodando na porta", PORT));
