# Dynamic Popup

This README will guide you through setting up and running the project, as well as provide an overview of the codebase and its functionalities.

## Cloning the Repository

To get started, clone the repository using the following command:

```bash
git clone https://github.com/kapalikkhanal/dynamic-popup.git
cd dynamic-popup
```

Once the project has been cloned, run these commands to install dependencies and start the development server:

```bash
npm install
npm run dev
```

Once the project starts correctly, you can add headings, body text, and footer text to start creating a popup. You can drag and drop the texts to position them as you like. The tools available allow you to customize the background color, text color, text alignments, image position, and more. You can also select the popup frequency, such as displaying it only once, repeatedly, or on reload.

## API Endpoints

### GET Request

The backend is built using Next.js. After cloning the repository, you can make a GET request to fetch the popup data using the following URL:

```bash
http://localhost:{port}/api/popup
```

This link will provide you with the JSON data of the response.

### PUT Request

To update the popup status, you can make a PUT request to the following URL:

```bash
http://localhost:{port}/api/popup
```

### Body Payload

```json
{
  "uuid": "Your pop-up uuid",
  "popup": true or false
}
```

## Popups Screenshots

Here are some screenshots of the popups created using this project:

![Popup Example 1](path/to/screenshot1.png)
*Description of Popup Example 1*

![Popup Example 2](path/to/screenshot2.png)
*Description of Popup Example 2*

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

For more information, visit the [developer link](https://kapalik.com).
