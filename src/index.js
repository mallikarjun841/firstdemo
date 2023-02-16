const express=require('express');
const app=express();
app.listen(5001,()=>{
    console.log("server is start at 5001");
})

app.get("/usercd",(request,response)=>{
    const make=request.query.user
    response.send(make);
})