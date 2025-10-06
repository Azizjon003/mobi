import { Scenes, Context } from "telegraf";
import { message } from "telegraf/filters";
import { db } from "../database";

interface AddAdminSceneSession extends Scenes.SceneSession {
  // Empty for now
}

interface AddAdminSceneContext extends Context {
  scene: Scenes.SceneContextScene<AddAdminSceneContext, AddAdminSceneSession>;
  session: AddAdminSceneSession;
}

export const addAdminScene = new Scenes.BaseScene<AddAdminSceneContext>(
  "add_admin"
);

const SUPER_ADMIN_ID = parseInt(process.env.SUPER_ADMIN_ID!);

// Handle /start command - return to start scene
addAdminScene.command("start", async (ctx) => {
  return ctx.scene.enter("start");
});

// Enter scene
addAdminScene.enter(async (ctx) => {
  await ctx.reply(
    "➕ Admin qo'shish\n\n" +
      "Foydalanuvchi username yoki ID'sini yuboring:\n\n" +
      "📝 Username: @username\n" +
      "🔢 ID: 123456789\n\n" +
      "❌ Bekor qilish: /cancel"
  );
});

// Handle text messages
addAdminScene.on(message("text"), async (ctx) => {
  const text = ctx.message.text.trim();

  // Check if this is a forwarded message
  if ("forward_from" in ctx.message && ctx.message.forward_from) {
    const forwardedFrom = ctx.message.forward_from;
    const userId = forwardedFrom.id;

    // Check if it's super admin
    if (userId === SUPER_ADMIN_ID) {
      await ctx.reply("❌ Asosiy adminni qo'shish kerak emas.");
      return ctx.scene.enter("start");
    }

    // Add user with seller role
    const added = db.addUser(userId, "seller", ctx.from!.id);

    if (added) {
      const username = forwardedFrom.username
        ? `@${forwardedFrom.username}`
        : "username yo'q";
      const firstName = forwardedFrom.first_name || "";
      const lastName = forwardedFrom.last_name || "";
      const fullName = `${firstName} ${lastName}`.trim();

      await ctx.reply(
        `✅ Foydalanuvchi (Sotuvchi) muvaffaqiyatli qo'shildi!\n\n` +
          `👤 Ism: ${fullName}\n` +
          `🆔 ID: ${userId}\n` +
          `📝 Username: ${username}`
      );
    } else {
      await ctx.reply(
        `❌ Bu foydalanuvchi allaqachon mavjud.\n\n🆔 User ID: ${userId}`
      );
    }

    return ctx.scene.enter("start");
  }

  // Check for cancel command
  if (text.startsWith("/")) {
    if (text === "/cancel") {
      await ctx.reply("❌ Admin qo'shish bekor qilindi.");
      return ctx.scene.enter("start");
    }
    return;
  }

  try {
    let userId: number;

    // Check if it's a username (starts with @)
    if (text.startsWith("@")) {
      const username = text.substring(1); // Remove @ symbol

      // Try to get user info by username
      try {
        // Unfortunately, Telegram Bot API doesn't have a direct method to get user by username
        // We need to use a workaround - ask user to forward a message or use user ID
        await ctx.reply(
          "⚠️ Afsuski, Telegram Bot API username orqali foydalanuvchi ID'sini to'g'ridan-to'g'ri ololmaydi.\n\n" +
            "📋 Iltimos, quyidagi usullardan birini ishlating:\n\n" +
            "1️⃣ Foydalanuvchidan biror xabarni forward qiling (Reply tugmasi)\n" +
            "2️⃣ Foydalanuvchi ID'sini kiriting\n" +
            "3️⃣ Foydalanuvchiga @userinfobot ga borib ID'sini olishni ayting\n\n" +
            "Misol: 123456789"
        );
        return;
      } catch (error) {
        await ctx.reply("❌ Username topilmadi. Iltimos, user ID yuboring.");
        return;
      }
    }

    // Try to parse as user ID
    userId = parseInt(text);

    if (isNaN(userId)) {
      await ctx.reply(
        "❌ Noto'g'ri format!\n\n" +
          "📝 Username: @username\n" +
          "🔢 ID: 123456789\n\n" +
          "Qaytadan urinib ko'ring yoki /cancel bosing."
      );
      return;
    }

    // Check if it's super admin
    if (userId === SUPER_ADMIN_ID) {
      await ctx.reply("❌ Asosiy adminni qo'shish kerak emas.");
      return ctx.scene.enter("start");
    }

    // Add user with seller role (default for old admin scene)
    const added = db.addUser(userId, "seller", ctx.from!.id);

    if (added) {
      await ctx.reply(
        `✅ Foydalanuvchi (Sotuvchi) muvaffaqiyatli qo'shildi!\n\n🆔 User ID: ${userId}`
      );
    } else {
      await ctx.reply(
        `❌ Bu foydalanuvchi allaqachon mavjud.\n\n🆔 User ID: ${userId}`
      );
    }

    // Return to start scene
    return ctx.scene.enter("start");
  } catch (error) {
    console.error("Error adding admin:", error);
    await ctx.reply(
      "❌ Xatolik yuz berdi. Iltimos, to'g'ri format kiriting:\n\n" +
        "🔢 User ID: 123456789"
    );
  }
});

// Handle /cancel command
addAdminScene.command("cancel", async (ctx) => {
  await ctx.reply("❌ Admin qo'shish bekor qilindi.");
  return ctx.scene.enter("start");
});

// Handle other input
addAdminScene.on("message", async (ctx) => {
  await ctx.reply(
    "⚠️ Iltimos, quyidagilardan birini yuboring:\n\n" +
      "1️⃣ Foydalanuvchi ID'si (123456789)\n" +
      "2️⃣ Foydalanuvchidan forward qilingan xabar\n" +
      "3️⃣ /cancel - Bekor qilish"
  );
});
