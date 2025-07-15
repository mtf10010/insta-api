const imageProxy = require("./api/image-proxy");
const express = require("express");
const cors = require("cors");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/api/image-proxy", imageProxy);


app.post("/api/profile", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "username é obrigatório" });
  }

  try {
    const response = await fetch(`https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "x-ig-app-id": "936619743392459"
      }
    });

    const json = await response.json();

    if (!json || !json.data || !json.data.user) {
      console.error("❌ Instagram respondeu com erro:", json);
      return res.status(500).json({ error: "Perfil não encontrado ou bloqueado" });
    }

    const user = json.data.user;

    const result = {
      username: user.username,
      full_name: user.full_name,
      biography: user.biography,
      profile_pic_url: user.profile_pic_url,
      is_private: user.is_private,
      posts: user.edge_owner_to_timeline_media?.count || 0,
      followers: user.edge_followed_by?.count || 0,
      following: user.edge_follow?.count || 0,
      feed: []
    };

    if (!user.is_private) {
      result.feed = user.edge_owner_to_timeline_media?.edges?.map(e => ({
        image: e.node.display_url,
        id: e.node.id
      })) || [];
    }

    return res.json(result);

  } catch (err) {
    console.error("🔥 Erro ao buscar perfil:", err.message);
    return res.status(500).json({ error: "Erro interno" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API rodando na porta ${PORT}`);
});
