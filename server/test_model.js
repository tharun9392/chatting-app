const Chat = require('./models/chat.model');

async function test() {
  console.log('--- TEST START ---');
  try {
    console.log('1. Calling Chat.findOneByParticipants...');
    const res = await Chat.findOneByParticipants('user1', 'user2');
    console.log('   Success! Found:', res);

    console.log('2. Calling Chat.create...');
    const newChat = await Chat.create({
      participants: ['u1', 'u2'],
      status: 'active',
      messages: []
    });
    console.log('   Success! Created:', newChat._id);
    
    console.log('--- TEST FINISHED ---');
    process.exit(0);
  } catch (err) {
    console.error('!!! TEST FAILED !!!');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    process.exit(1);
  }
}

test();
