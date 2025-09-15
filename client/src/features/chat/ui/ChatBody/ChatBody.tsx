import type {Message} from "../../../../shared/types.ts";
import {getSocket} from "../../../../shared/socket.ts";

interface ChatBodyProps {
    messages: Message[];
}

export function ChatBody({ messages }: ChatBodyProps) {
    const socket = getSocket();
    const mySocketId = socket.id;

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white rounded-lg shadow-inner border border-gray-200">
            {messages.length === 0 ? (
                <p className="text-center text-gray-500 italic">Сообщений пока нет.</p>
            ) : (
                messages.map((element) => (
                    <div
                        key={element.id}
                        className={`flex ${
                            element.socketId === mySocketId ? "justify-end" : "justify-start"
                        }`}
                    >
                        <div
                            className={`max-w-[70%] p-3 rounded-lg shadow-sm ${
                                element.socketId === mySocketId
                                    ? "bg-green-100 text-gray-800"
                                    : "bg-red-100 text-gray-800"
                            }`}
                        >
                            <h5 className="font-bold text-sm mb-1">{element.name || element.sender}</h5>
                            <p className="text-base break-words">{element.text}</p>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}




// import {useSocket} from "../../../../shared";
//
// interface Message {
//     id: string;
//     name: string | null;
//     text: string;
//     socketId?: string;
//     sender?: string;
//     roomId?: string;
// }
//
// interface ChatBodyProps {
//     messages: Message[];
// }
//
// export function ChatBody({ messages }: ChatBodyProps) {
//     const socket = useSocket();
//
//     return (
//         <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white rounded-lg shadow-inner border border-gray-200">
//             {messages.length === 0 ? (
//                 <p className="text-center text-gray-500 italic">Сообщений пока нет.</p>
//             ) : (
//                 messages.map((element) => (
//                     <div
//                         key={element.id}
//                         className={`flex ${element.socketId === socket.id ? 'justify-end' : 'justify-start'}`}
//                     >
//                         <div
//                             className={`max-w-[70%] p-3 rounded-lg shadow-sm ${
//                                 element.socketId === socket.id ? 'bg-green-100 text-gray-800' : 'bg-red-100 text-gray-800'
//                             }`}
//                         >
//                             <h5 className="font-bold text-sm mb-1">{element.name || element.sender}</h5>
//                             <p className="text-base break-words">{element.text}</p>
//                         </div>
//                     </div>
//                 ))
//             )}
//         </div>
//     );
// }