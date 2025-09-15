import { type ChangeEvent, type FormEvent } from 'react'

interface Props {
	handleSubmit: (e: FormEvent<HTMLFormElement>) => void
	setMessage: (value: string) => void
	message: string
}


export function ChatForm( {handleSubmit, setMessage, message}: Props) {

	function handleMessage(event: ChangeEvent<HTMLInputElement>) {
		setMessage(event.target.value)
	}

	return <form onSubmit={handleSubmit} className="flex gap-3 p-2 mt-4">
		<input
			type="text"
			value={message}
			onChange={handleMessage}
			placeholder="Введите сообщение..."
			className="flex-grow p-3 border border-gray-300 rounded-md"
		/>
		<button type="submit" className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700">
			Написать
		</button>
	</form>
}
