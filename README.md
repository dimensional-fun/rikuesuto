# Rikuesuto

> A simple node.js http client.

- **[Discord Server](https://discord.gg/JrHfSmb)**
- **[Github](https://github.com/melike2d/rikuesuto)**

*"rikuesuto" is request in japanese*

## Installation and Usage

```shell script
yarn add rikuesuto
```

**JSON Response**: 

```ts
import { make } from "rikuesuto";

make("https://api.github.com/users/melike2d")
   .then(res => console.log(res.json))
```

**POST Request**:

```ts
import { make, Method } from "rikuesuto";

make("https://httpbin.org/post")
    .method(Method.POST)
    .body({ a: 1 }) // automatically stringifies the json.
    .then((res) => console.log(res.json))
```

---

> [rikuesuto](https://github.com/melike2d/rikuesuto) is licensed under the **MIT License**.
