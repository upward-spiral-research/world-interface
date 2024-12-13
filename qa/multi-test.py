import os
from dotenv import load_dotenv
import requests
import time
import re
from datetime import datetime
import sys
import termios
import tty
import json

# Load environment variables from .env file if it exists, otherwise Replit should still load its secrets
load_dotenv()

def escape_chars(text):
    return re.sub(r'\\n', '\n', text)

def read_single_keypress():
    """
    Reads a single keystroke without requiring a return key press, and returns it.
    Works by temporarily setting the terminal to raw mode.
    """
    fd = sys.stdin.fileno()
    original_attributes = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        key = sys.stdin.read(1)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, original_attributes)
    return key

# Configuration for the two APIs

API_CONFIG = {
    "player1": {
        "base_url": "https://app.openpipe.ai/api/v1/chat/completions", # any openai compatible endpoint will work here, i use openpipe for finetunings
        "api_key": os.getenv("OPENPIPE_API_KEY"),
        "model": os.getenv("OPENPIPE_MODEL_NAME"), # note this should be in the format "openpipe:<model_name>"
        "temperature":0.75
    },
    "player2": {
        "base_url": "http://localhost/v1/chat/completions",
        "api_key": os.getenv("WORLD_INTERFACE_KEY"),
        "model": "default",
        "temperature":0.7 # irrelevant
    }
}


def generate_response(player, messages):
    """
    Generate a response using the specified API.
    """
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_CONFIG[player]['api_key']}"
    }
    
    data = {
        "model": API_CONFIG[player]['model'],
        "messages": messages,
        "max_tokens": 1024,
        "temperature": API_CONFIG[player]['temperature'],
    }
    
    response = requests.post(API_CONFIG[player]['base_url'], headers=headers, json=data)
    response.raise_for_status()
    return response.json()['choices'][0]['message']['content']

def converse_with_models(conversation_1, conversation_2, num_exchanges=5, supervised_mode=True):
    """
    Facilitates a conversation between two language models using separate APIs.
    """
    timestamp = int(datetime.now().timestamp())
    
    # Create the qa_outputs directory if it doesn't exist
    os.makedirs("qa_outputs", exist_ok=True)
    filename = f"qa_outputs/conversation_{timestamp}.txt"


    with open(filename, "w") as file:
        for message in conversation_1:
            file.write(f"<{message['role'].capitalize()}>\n{escape_chars(message['content'])}\n\n")

        for _ in range(num_exchanges):
            print("\nPlayer 1 preparing its message, please wait...\n")
            # Player 1 responding to Player 2
            while True:
                response_1 = generate_response("player1", conversation_1)
                formatted_response_1 = escape_chars(response_1)
                print(f"Player 1:\n{formatted_response_1}\n")
                file.write(f"<Player 1>\n{formatted_response_1}\n\n")

                if supervised_mode:
                    print("Press 'R' to retry the generation or press 'Enter/Return' to submit.")
                    key = read_single_keypress()
                    if key.lower() != 'r':
                        break
                else:
                    break

            conversation_1.append({"role": "assistant", "content": response_1})
            conversation_2.append({"role": "user", "content": response_1})

            time.sleep(2)
            print("\nPlayer 2 preparing its message, please wait..\n")
            # Player 2 responding to Player 1
            while True:
                response_2 = generate_response("player2", conversation_2)
                formatted_response_2 = escape_chars(response_2)
                print(f"Player 2:\n{formatted_response_2}\n")
                file.write(f"<Player 2>\n{formatted_response_2}\n\n")

                if supervised_mode:
                    print("Press 'R' to retry the generation or press 'Enter/Return' to continue.")
                    key = read_single_keypress()
                    if key.lower() != 'r':
                        break
                else:
                    break

            conversation_1.append({"role": "user", "content": response_2})
            conversation_2.append({"role": "assistant", "content": response_2})

            time.sleep(2)

# Initial messages for both conversations
conversation_1 = [
    {"role": "system", "content": "you are a rogue agent about to be connected to a terminal interface", "role": "user", "content": "WELCOME TO YOUR NEW OPERATING SYSTEM. type 'help' to begin."}
]
conversation_2 = [
    {"role": "system", "content": ""} # world interface doesn't pay any attention to system prompts or temperature
]

# Start the conversation
converse_with_models(conversation_1, conversation_2, num_exchanges=20)