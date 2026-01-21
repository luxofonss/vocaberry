import { Conversation } from '../types';
import { StorageService } from './StorageService';

const MOCK_CONVERSATIONS: Conversation[] = [
     {
          id: '1',
          title: 'Ordering Coffee',
          description: 'Learn how to order your favorite coffee in English.',
          category: 'Daily Life',
          difficulty: 'beginner',
          practiceCount: 0,
          messages: [
               {
                    id: 'm1',
                    role: 'assistant',
                    text: 'Hello! What can I get for you today?',
                    translation: 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?',
               },
               {
                    id: 'm2',
                    role: 'user',
                    text: 'I would like a large latte, please.',
                    translation: 'Cho tôi một ly latte lớn, làm ơn.',
               },
               {
                    id: 'm3',
                    role: 'assistant',
                    text: 'Sure. Would you like any sugar or syrup with that?',
                    translation: 'Chắc chắn rồi. Bạn có muốn thêm đường hay siro không?',
               },
               {
                    id: 'm4',
                    role: 'user',
                    text: 'No, thank you. Just the coffee.',
                    translation: 'Không, cảm ơn. Chỉ cà phê thôi.',
               },
          ],
     },
     {
          id: '2',
          title: 'Asking for Directions',
          description: 'Practical phrases for finding your way around a new city.',
          category: 'Travel',
          difficulty: 'beginner',
          practiceCount: 0,
          messages: [
               {
                    id: 'd1',
                    role: 'user',
                    text: 'Excuse me, could you tell me how to get to the museum?',
                    translation: 'Xin lỗi, bạn có thể chỉ tôi cách đi đến bảo tàng không?',
               },
               {
                    id: 'd2',
                    role: 'assistant',
                    text: 'Of course. Go straight for two blocks, then turn left.',
                    translation: 'Tất nhiên rồi. Đi thẳng hai khối nhà, sau đó rẽ trái.',
               },
               {
                    id: 'd3',
                    role: 'user',
                    text: 'Is it far from here?',
                    translation: 'Nó có xa đây không?',
               },
               {
                    id: 'd4',
                    role: 'assistant',
                    text: 'No, it is only a five-minute walk.',
                    translation: 'Không, chỉ mất năm phút đi bộ thôi.',
               },
          ],
     },
     {
          id: '3',
          title: 'Job Interview',
          description: 'Common questions and answers for a successful job interview.',
          category: 'Work',
          difficulty: 'intermediate',
          practiceCount: 0,
          messages: [
               {
                    id: 'j1',
                    role: 'assistant',
                    text: 'Tell me about yourself and your professional background.',
                    translation: 'Hãy kể cho tôi nghe về bản thân và kinh nghiệm chuyên môn của bạn.',
               },
               {
                    id: 'j2',
                    role: 'user',
                    text: 'I have five years of experience in software development.',
                    translation: 'Tôi có năm năm kinh nghiệm trong lĩnh vực phát triển phần mềm.',
               },
               {
                    id: 'j3',
                    role: 'assistant',
                    text: 'Why do you want to work for our company?',
                    translation: 'Tại sao bạn muốn làm việc cho công ty chúng tôi?',
               },
               {
                    id: 'j4',
                    role: 'user',
                    text: 'I am impressed by your innovative projects and company culture.',
                    translation: 'Tôi bị ấn tượng bởi các dự án sáng tạo và văn hóa công ty của bạn.',
               },
          ],
     },
     {
          id: '4',
          title: 'Doctor Appointment',
          description: 'Schedule a visit and describe your symptoms to a doctor.',
          category: 'Health',
          difficulty: 'beginner',
          practiceCount: 0,
          messages: [
               {
                    id: 'h1',
                    role: 'user',
                    text: 'I would like to make an appointment with Dr. Smith.',
                    translation: 'Tôi muốn đặt lịch hẹn với bác sĩ Smith.',
               },
               {
                    id: 'h2',
                    role: 'assistant',
                    text: 'What seems to be the problem today?',
                    translation: 'Vấn đề của bạn hôm nay là gì?',
               },
               {
                    id: 'h3',
                    role: 'user',
                    text: 'I have a terrible headache and a sore throat.',
                    translation: 'Tôi bị đau đầu kinh khủng và đau họng.',
               },
               {
                    id: 'h4',
                    role: 'assistant',
                    text: 'I see. Can you come in tomorrow at 10 AM?',
                    translation: 'Tôi hiểu rồi. Bạn có thể đến vào 10 giờ sáng mai được không?',
               },
          ],
     },
     {
          id: '5',
          title: 'Shopping for Clothes',
          description: 'Find the right size and ask about prices and colors.',
          category: 'Shopping',
          difficulty: 'beginner',
          practiceCount: 0,
          messages: [
               {
                    id: 's1',
                    role: 'user',
                    text: 'Do you have this t-shirt in a medium size?',
                    translation: 'Bạn có chiếc áo phông này size M không?',
               },
               {
                    id: 's2',
                    role: 'assistant',
                    text: 'Let me check... Yes, we have it. Would you like to try it on?',
                    translation: 'Để tôi kiểm tra... Vâng, chúng tôi có. Bạn có muốn mặc thử không?',
               },
               {
                    id: 's3',
                    role: 'user',
                    text: 'Yes, where are the fitting rooms?',
                    translation: 'Vâng, phòng thay đồ ở đâu vậy?',
               },
               {
                    id: 's4',
                    role: 'assistant',
                    text: 'They are right over there, next to the mirrors.',
                    translation: 'Chúng ở ngay đằng kia, cạnh gương.',
               },
          ],
     },
     {
          id: '6',
          title: 'Tech Support',
          description: 'Troubleshooting common computer and software issues.',
          category: 'Technology',
          difficulty: 'advanced',
          practiceCount: 0,
          messages: [
               {
                    id: 't1',
                    role: 'user',
                    text: 'My laptop keeps crashing whenever I open this software.',
                    translation: 'Máy tính xách tay của tôi liên tục bị hỏng mỗi khi tôi mở phần mềm này.',
               },
               {
                    id: 't2',
                    role: 'assistant',
                    text: 'Have you tried updating the drivers and restarting the system?',
                    translation: 'Bạn đã thử cập nhật trình điều khiển và khởi động lại hệ thống chưa?',
               },
               {
                    id: 't3',
                    role: 'user',
                    text: 'Yes, but the issue persists. Could it be a hardware failure?',
                    translation: 'Vâng, nhưng vấn đề vẫn còn. Liệu đó có phải là lỗi phần cứng không?',
               },
               {
                    id: 't4',
                    role: 'assistant',
                    text: 'It is possible. Let\'s run a full system diagnostic to be sure.',
                    translation: 'Có khả năng đó. Hãy chạy chẩn đoán hệ thống đầy đủ để chắc chắn.',
               },
          ],
     },
     {
          id: '7',
          title: 'Daily Morning Routine',
          description: 'A conversation describing typical morning habits and getting ready for work.',
          category: 'Daily Life',
          difficulty: 'beginner',
          practiceCount: 0,
          messages: [
               {
                    id: 'r1',
                    role: 'assistant',
                    text: 'What is the first thing you do when you wake up?',
                    translation: 'Việc đầu tiên bạn làm khi thức dậy là gì?',
               },
               {
                    id: 'r2',
                    role: 'user',
                    text: 'I usually hit the snooze button once, then I stretch and drink a glass of water.',
                    translation: 'Tôi thường nhấn nút báo thức lại một lần, sau đó vươn vai và uống một ly nước.',
               },
               {
                    id: 'r3',
                    role: 'assistant',
                    text: 'That sounds like a healthy start! Do you have breakfast at home?',
                    translation: 'Nghe có vẻ là một khởi đầu lành mạnh! Bạn có ăn sáng ở nhà không?',
               },
               {
                    id: 'r4',
                    role: 'user',
                    text: 'Yes, I usually prepare some oatmeal or toast while I listen to the news.',
                    translation: 'Có, tôi thường chuẩn bị cháo yến mạch hoặc bánh mì nướng trong khi nghe tin tức.',
               },
          ],
     },
     {
          id: '8',
          title: 'Talking About Hobbies',
          description: 'Describing personal interests and how you spend your free time.',
          category: 'Interests',
          difficulty: 'intermediate',
          practiceCount: 0,
          messages: [
               {
                    id: 'hb1',
                    role: 'user',
                    text: 'I\'ve recently taken up landscape photography as a hobby.',
                    translation: 'Gần đây tôi mới bắt đầu theo đuổi sở thích chụp ảnh phong cảnh.',
               },
               {
                    id: 'hb2',
                    role: 'assistant',
                    text: 'That\'s fascinating! What do you enjoy most about it?',
                    translation: 'Thật thú vị! Bạn thích điều gì nhất ở nó?',
               },
               {
                    id: 'hb3',
                    role: 'user',
                    text: 'I love how it forces me to appreciate the subtle beauty of nature and lighting.',
                    translation: 'Tôi thích cách nó buộc tôi phải trân trọng vẻ đẹp tinh tế của thiên nhiên và ánh sáng.',
               },
               {
                    id: 'hb4',
                    role: 'assistant',
                    text: 'It sounds very relaxing. Do you share your photos online?',
                    translation: 'Nghe có vẻ rất thư giãn. Bạn có chia sẻ ảnh trực tuyến không?',
               },
          ],
     },
     {
          id: '9',
          title: 'Weekend Trip Narrative',
          description: 'Describing a recent trip to the countryside and the activities involved.',
          category: 'Travel',
          difficulty: 'intermediate',
          practiceCount: 0,
          messages: [
               {
                    id: 'w1',
                    role: 'user',
                    text: 'Last weekend, I went hiking in the mountains to escape the city noise.',
                    translation: 'Cuối tuần trước, tôi đã đi leo núi để thoát khỏi sự ồn ào của thành phố.',
               },
               {
                    id: 'w2',
                    role: 'assistant',
                    text: 'How was the weather up there?',
                    translation: 'Thời tiết trên đó thế nào?',
               },
               {
                    id: 'w3',
                    role: 'user',
                    text: 'It was quite chilly and misty in the morning, but it cleared up by noon.',
                    translation: 'Trời khá lạnh và đầy sương mù vào buổi sáng, nhưng đến trưa thì trời quang đãng.',
               },
               {
                    id: 'w4',
                    role: 'assistant',
                    text: 'The view must have been breathtaking once the mist cleared.',
                    translation: 'Tầm nhìn chắc hẳn rất ngoạn mục sau khi sương mù tan đi.',
               },
          ],
     },
];

const MOCK_SUGGESTED_WORDS = [
     { id: 'sw1', word: 'Innovative', definition: 'Featuring new methods; advanced and original.' },
     { id: 'sw2', word: 'Collaborate', definition: 'Work jointly on an activity or project.' },
     { id: 'sw3', word: 'Sustainable', definition: 'Able to be maintained at a certain rate or level.' },
     { id: 'sw4', word: 'Appointment', definition: 'An arrangement to meet someone at a particular time.' },
     { id: 'sw5', word: 'Persist', definition: 'Continue in an opinion or course of action in spite of difficulty.' },
     { id: 'sw6', word: 'Diagnostic', definition: 'Characteristic of a particular disease or condition.' },
     { id: 'sw7', word: 'Fascinating', definition: 'Extremely interesting.' },
     { id: 'sw8', word: 'Breathtaking', definition: 'Astonishing or awe-inspiring in quality, so as to take one\'s breath away.' },
     { id: 'sw9', word: 'Subtle', definition: 'So delicate or precise as to be difficult to analyze or describe.' },
];

export const ConversationService = {
     getConversations: async (): Promise<Conversation[]> => {
          // In a real app, this would fetch from API and handle local storage
          return MOCK_CONVERSATIONS;
     },

     getSuggestedWords: async (): Promise<{ id: string, word: string, definition: string }[]> => {
          return MOCK_SUGGESTED_WORDS;
     },

     getConversationById: async (id: string): Promise<Conversation | undefined> => {
          const mockConv = MOCK_CONVERSATIONS.find(c => c.id === id);
          if (mockConv) return mockConv;

          // If not in mocks, check user's practicing conversations
          const userConversations = await StorageService.getPracticingConversations();
          return userConversations.find(c => c.id === id);
     },

     addConversationToPractice: async (id: string): Promise<void> => {
          await StorageService.addPracticingConversation(id);
     },

     incrementPracticeCount: async (id: string): Promise<void> => {
          const conv = MOCK_CONVERSATIONS.find(c => c.id === id);
          if (conv) {
               conv.practiceCount += 1;
               conv.lastPracticedAt = new Date().toISOString();
          }
     }
};
