<p align="center">
  <img src="https://github.com/user-attachments/assets/246eb6e8-1958-4ae1-a08e-c279444b7ab8" width="256" height="256">
</p>
<p align="center">
  An aggressive JavaScript minifier for code golf.
</p>
<hr>

golfy is a program that converts the input code into code optimized for code golf.

The goals of this project are as follows:
- Shorter code over stability
- Optimization of the output over processing time
- The shortest possible expression, even if it's hacky

The things this project does not aim for:
- Ensuring compatibility across various runtime environments and backward compatibility
- Maintaining internal implementation consistency with the input code (as long as the same input produces the same output, it's fine)
- Execution performance (code length takes priority)

## Usage

> [!WARNING]  
> WIP project and is highly experimental and unstable.

```sh
npm install -g golfy

golfy code.js
# or
cat code.js | golfy
```
