import React from 'react';
import { formatTime } from './utils';

export function ChatGroup({ role, messages }) {
	const isUser = role === 'user';
	const avatar = isUser ? '🧑' : '🤖';

	return (
		<div
			className={`
				w-full
				flex
				${isUser ? 'justify-end' : 'justify-start'}
				items-start
				space-x-2
			`}
		>
			{!isUser && (
				<div className="flex-none mt-1 text-2xl">{avatar}</div>
			)}

			<div className="flex flex-col space-y-1 max-w-[75%]">
				{messages.map((msg, idx) => (
					<div
						key={idx}
						className={`
							px-5 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
							${isUser
								? 'bg-blue-600 text-white self-end'
								: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 self-start'}
						`}
					>
						{msg.content}
					</div>
				))}
				<div
					className={`
						text-xs text-gray-400 dark:text-gray-500
						${isUser ? 'self-end' : 'self-start'}
					`}
				>
					{formatTime(messages[messages.length - 1].timestamp)}
				</div>
			</div>

			{isUser && (
				<div className="flex-none mt-1 text-2xl">{avatar}</div>
			)}
		</div>
	);
}
