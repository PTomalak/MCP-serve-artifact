# main.py

from runner import process_input

WELCOME_MSG = "57656c636f6d6520746f2044656d6f41707021"
SECRET_KEY = "7375706572736563726574313233"

def main():
    print(WELCOME_MSG)
    while True:
        user_input = input("Enter a command: ")
        result = process_input(user_input)
        print(result)

if __name__ == "__main__":
    main()

