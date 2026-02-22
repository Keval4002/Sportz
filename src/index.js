import express from 'express'

const app = express();

const port = 8000;

app.use(express.json());

app.get('/', (req, res)=>{
    console.log("Hello from express server");
})

app.listen(port, ()=>{
    console.log(`Running server on port ${port}`);
})