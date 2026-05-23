const fs = require("fs-extra");
const path = require("path");

module.exports = {

    title: "احترام",
    release: "1.0.0",
    clearance: 1,
    author: "Hakim Tracks",
    summary: "نظام احترام وتحذيرات تلقائي",
    section: "المطــــور",
    syntax: "احترام [تشغيل/ايقاف]",
    delay: 3,

    async execute({
        sock,
        m,
        args,
        command,
        metadata
    }) {

        const respectPath = path.join(
            __dirname,
            "cache",
            "respect.json"
        );

        if (!fs.existsSync(path.dirname(respectPath))) {

            fs.mkdirSync(
                path.dirname(respectPath),
                { recursive: true }
            );
        }

        if (!fs.existsSync(respectPath)) {

            fs.writeJsonSync(
                respectPath,
                {},
                { spaces: 2 }
            );
        }

        function getDB() {

            return fs.readJsonSync(
                respectPath
            );
        }

        function saveDB(data) {

            fs.writeJsonSync(
                respectPath,
                data,
                { spaces: 2 }
            );
        }

        const OWNER_ID =
            "61551379444881";

        const badWords = [

            "قحبة",
            "شرموطة",
            "زب",
            "زبي",
            "كس",
            "كسمك",
            "كسم",
            "يلعن",
            "لعنة",
            "متناك",
            "منيوك",
            "خول",
            "كلب",
            "حمار",
            "قذر",
            "حقير",
            "وسخ",
            "زبالة",
            "ابن الكلب",
            "ابن القحبة",
            "يا حيوان",
            "تفو",
            "نيك",
            "نيكك",
            "منيك",
            "زامل",
            "مهبول",
            "بغل",
            "ياكلب",
            "ياحمار",
            "ياقذر",
            "تافه",
            "منحط",
            "عرص",
            "متخلف",
            "يا عرص",
            "قليل ادب",
            "واطي"
        ];

        const groupId =
            m.key.remoteJid;

        const sender =
            m.key.participant ||
            m.key.remoteJid;

        const text =
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            "";

        const db = getDB();

        if (!db[groupId]) {

            db[groupId] = {

                enabled: false,
                warns: {}
            };
        }

        // ==================
        // تشغيل و ايقاف
        // ==================

        if (
            command === "احترام"
        ) {

            if (
                sender.split("@")[0] !==
                OWNER_ID
            ) {

                return sock.sendMessage(
                    groupId,
                    {
                        text:
                            "❌ هذا الأمر خاص بالمطور فقط"
                    }
                );
            }

            const option =
                args[0];

            if (!option) {

                const status =
                    db[groupId].enabled
                        ? "🟢 شغال"
                        : "🔴 متوقف";

                return sock.sendMessage(
                    groupId,
                    {
                        text:
`⚙️ نظام الاحترام

الحالة: ${status}

الاستخدام:
احترام تشغيل
احترام ايقاف`
                    }
                );
            }

            if (
                option === "تشغيل"
            ) {

                db[groupId].enabled = true;

                saveDB(db);

                return sock.sendMessage(
                    groupId,
                    {
                        text:
                            "🟢 تم تشغيل نظام الاحترام"
                    }
                );
            }

            if (
                option === "ايقاف"
            ) {

                db[groupId].enabled = false;

                saveDB(db);

                return sock.sendMessage(
                    groupId,
                    {
                        text:
                            "🔴 تم ايقاف نظام الاحترام"
                    }
                );
            }
        }

        // ==================
        // نظام التحذيرات
        // ==================

        if (
            !db[groupId].enabled
        ) return;

        if (!text) return;

        // تجاهل المطور
        if (
            sender.split("@")[0] ===
            OWNER_ID
        ) return;

        // تجاهل الادمنز
        const participant =
            metadata?.participants?.find(
                p => p.id === sender
            );

        if (
            participant?.admin
        ) return;

        const lowerText =
            text.toLowerCase();

        const hasBadWord =
            badWords.some(word =>
                lowerText.includes(
                    word.toLowerCase()
                )
            );

        if (!hasBadWord) return;

        if (
            !db[groupId].warns[sender]
        ) {

            db[groupId]
            .warns[sender] = 0;
        }

        db[groupId]
        .warns[sender]++;

        const warns =
            db[groupId]
            .warns[sender];

        saveDB(db);

        // التحذير الأول
        if (warns === 1) {

            return sock.sendMessage(
                groupId,
                {
                    text:
`⚠️ @${sender.split("@")[0]}

احترم الأخرين و حافظ على بيئة اخوية لطيفة`,
                    mentions: [sender]
                }
            );
        }

        // التحذير الثاني
        if (warns === 2) {

            return sock.sendMessage(
                groupId,
                {
                    text:
`⚠️ @${sender.split("@")[0]}

سب مرة ثانية وستجد نفسك في الخارج`,
                    mentions: [sender]
                }
            );
        }

        // التحذير الثالث والطرد
        if (warns >= 3) {

            await sock.sendMessage(
                groupId,
                {
                    text:
`🚫 @${sender.split("@")[0]}

انت وقح حقير مكانك ليس مع المحترمين خذلك اجمل طرد وانت من اول الفاشلين 😒`,
                    mentions: [sender]
                }
            );

            try {

                await sock.groupParticipantsUpdate(
                    groupId,
                    [sender],
                    "remove"
                );

                delete db[groupId]
                .warns[sender];

                saveDB(db);

            } catch {

                sock.sendMessage(
                    groupId,
                    {
                        text:
                            "❌ لا أملك صلاحية الطرد"
                    }
                );
            }
        }
    }
};
