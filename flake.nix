{
  description = "tisanerie dev shell";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";  # ponytail: single machine; add flake-utils for multi-arch
      pkgs = import nixpkgs { inherit system; };
      inherit (nixpkgs) lib;
      # The Node major comes from .nvmrc, read as scripts/check-node-pins.sh
      # reads it: its one line that is neither blank nor a # comment holds a
      # version such as 24, v24 or 24.12.0. There is no fallback to another
      # major: a nixpkgs without nodejs_<major> fails, naming the attribute,
      # and a flake.lock bump fixes it.
      nvmrc = builtins.filter (line: builtins.match "[[:space:]]*(#.*)?" line == null)
        (lib.splitString "\n" (builtins.readFile ./.nvmrc));
      version = if builtins.length nvmrc == 1
        then builtins.match "[[:space:]]*v?([0-9]+)(\\.[0-9]+){0,2}[[:space:]]*" (builtins.head nvmrc)
        else null;
      nodeMajor = if version != null then builtins.head version
        else throw ".nvmrc must have one line that is neither blank nor a comment, a Node version such as 24 or 24.12.0. Those lines read: ${builtins.toJSON nvmrc}";
    in {
      devShells.x86_64-linux.default = pkgs.mkShell {
        packages = [ pkgs."nodejs_${nodeMajor}" ];
      };
    };
}
