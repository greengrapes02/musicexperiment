View on preview on Youtube: https://youtu.be/mzna1FXE1WI
[![Dashboard Demo](https://img.youtube.com/vi/mzna1FXE1WI/maxresdefault.jpg)](https://youtu.be/mzna1FXE1WI)



# Billboard Top 10 Visualizations

https://observablehq.com/d/68c81dce0b0653f1@845

View this notebook in your browser by running a web server in this folder. For
example:

~~~sh
npx http-server
~~~

Or, use the [Observable Runtime](https://github.com/observablehq/runtime) to
import this module directly into your application. To npm install:

~~~sh
npm install @observablehq/runtime@5
npm install https://api.observablehq.com/d/68c81dce0b0653f1@845.tgz?v=3
~~~

Then, import your notebook and the runtime as:

~~~js
import {Runtime, Inspector} from "@observablehq/runtime";
import define from "68c81dce0b0653f1";
~~~

To log the value of the cell named “foo”:

~~~js
const runtime = new Runtime();
const main = runtime.module(define);
main.value("foo").then(value => console.log(value));
~~~
