import { supabase } from "../services/supabase.js";

export default async function dashboardCommand(interaction) {
  await interaction.reply({
    embeds: [
      {
        title: "🌍 UniChat Dashboard",
        description:
          "Manage your language system from here.\n\n" +
          "⚙️ Status: Active\n" +
          "🔁 Auto translation: ON\n" +
          "👥 Role system: ENABLED",
        color: 0x00bfff,
        fields: [
          {
            name: "Commands",
            value:
              "🟢 Setup system\n" +
              "🧹 Uninstall system\n" +
              "🌐 Set language\n" +
              "🔄 Sync roles"
          }
        ]
      }
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: "Run Setup",
            style: 1,
            custom_id: "dash_setup"
          },
          {
            type: 2,
            label: "Sync Roles",
            style: 2,
            custom_id: "dash_sync"
          },
          {
            type: 2,
            label: "Uninstall",
            style: 4,
            custom_id: "dash_uninstall"
          }
        ]
      }
    ],
    ephemeral: true
  });
}
