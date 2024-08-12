//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ETHPool is ERC20("sETH", "sETH") {
    /// @dev admin address
    address public admin;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event AdminUpdated(address indexed admin);

    constructor() {
        admin = msg.sender;
    }

    /**
     * @notice deposit ETH into the pool
     * @dev mints user sETH token in return
     */
    function deposit() external payable {
        uint256 totalETH = address(this).balance;
        uint256 totalShares = totalSupply();
        if (totalShares == 0 || totalETH == 0) {
            _mint(msg.sender, msg.value);
        } else {
            uint256 what = msg.value * totalShares / (totalETH - msg.value);
            _mint(msg.sender, what);
        }

        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @notice withdraw ETH & Reward from the pool
     * @dev burns sETH token from user
     */
    function withdraw() external {
        uint256 totalETH = address(this).balance;
        uint256 totalShares = totalSupply();
        uint256 share = balanceOf(msg.sender);
        require(share > 0, "nothing to withdraw");

        uint256 what = share * totalETH / totalShares;
        _burn(msg.sender, share);
        payable(msg.sender).transfer(what);

        emit Withdrawn(msg.sender, what);
    }

    /**
     * @notice set new admin
     * @dev only admin can call
     * @param _admin new admin address
     */
    function setAdmin(address _admin) external {
        require(msg.sender == admin, "not admin");
        require(_admin != address(0), "invalid admin");
        require(_admin != admin, "same admin");

        admin = _admin;
        emit AdminUpdated(_admin);
    }

    /**
     * @notice add ETH reward to the pool
     * @dev only admin can add reward
     */
    function addReward() external payable {
        require(msg.sender == admin, "not admin");
    }

    fallback() external payable {
        revert("do not send ETH directly");
    }
}
