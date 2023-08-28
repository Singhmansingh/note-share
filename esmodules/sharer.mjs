
/*
Note Share 

Objectives:
GM arrage players in a circular order
players create a note in an interface
players can send a note to either:
    the player to their left
    the player yo their right
    any player
    the GM
When a player recieves a note, their recieve a notfication
They can open the note to read it. only they can read the message
Notes are not kept by default; can optionally be stored

*/

/*

Settings

*/
async function initSettings(){
    await game.settings.register("note-share","broadcastNoteShared", {
        name:"Broadcast Note Sharing",
        hint:"Send a message in chat that a note has been shared. the contents of the note will not be visible",
        scope:"world",
        config:true,
        type:Boolean,
        default:false,
        onChange: value => {
            Hooks.call("noteshareSettingsUpdate",value);
        }
    });

    await game.settings.register("note-share","sharerAlias", {
        name:"Note share from name",
        hint:"Name for the note broadcast share. Leave empty to send by user",
        scope:"world",
        config:true,
        type:String,
        default:'System',
        onChange: value => {
            Hooks.call("noteshareSettingsUpdate",value);
        }
    });

    await game.settings.register("note-share","titleTemplates", {
        name:"Titles templates",
        hint:"Adds a template to select for a title. seperate prompts with a |.",
        scope:"world",
        config:true,
        type:String,
        onChange: value => {
            Hooks.call("noteshareSettingsUpdate",value);
        }
    });
}


/* 

Hooks

*/


Hooks.on('ready',function(){
    initSettings();
})

Hooks.on('renderSidebarTab',function (app,html,data) {
    renderNoteButton(html);
})



/*
createNoteFunction
    get the current player 
    open interface
    get player answer on submit
    get recipient
    notify recipient of the note
    open dialog for recipient to view the note
    end
*/

async function createNote(){

    const noteShared=game.settings.get('note-share','broadcastNoteShared');

    const noteTempPath="modules/note-share/templates/note.hbs";
    const noteWhisperPath="modules/note-share/templates/whisper.hbs";

    const users=game.users; // change to global circle

    var titleTemplates=game.settings.get('note-share','titleTemplates');
    var titles=[];
    if(titleTemplates) titles=titleTemplates.split('|');

    const template = await renderTemplate(noteTempPath, { users ,titles});

    new Dialog({
        title: "New Sharable Note",
        content: template,
        buttons:{
            send: {
                icon:'<i class="fas fa-send"></i>',
                label:'Send',
                callback: async (html) => {   
                    let title = html.find('[name="title"]').val();
                    let from = game.user.name;
                    let to = html.find('[name="to"]').val();
                    let message = html.find('[name="message"]').val();

                    let whstemplate = await renderTemplate(noteWhisperPath, {title, message});

                    ChatMessage.create({
                        content: whstemplate,
                        whisper: ChatMessage.getWhisperRecipients(to)
                      });

                    if(noteShared){

                        const sharerAlias = game.settings.get('note-share','sharerAlias');

                        ChatMessage.create({
                            content: `<em>${from} passed a note to ${to}</em>`,
                            speaker: { alias: sharerAlias}
                        })
                    }
                      
                }
            }
        }
    }).render(true);
}

function renderNoteButton(html){
    //if(html.attr('id')!='journal') return;
    let icon ='fas fa-share-square';
    let actionbuttons = html.find('.chat-control-icon');
    let noteButton = $('<a class="note-share-button" style="flex:0;flex-shrink:1;padding: 0 6px;" class="hover"><i class="'+icon+'"></i></a>');
    noteButton.on('click',()=> { createNote() });
    actionbuttons.before(noteButton);
}

